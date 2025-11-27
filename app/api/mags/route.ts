// app/api/mags/route.ts
import { db } from '@/lib/db';
import { getServerSession } from '@/lib/auth/auth';
import { downloadlist } from '@/lib/utils/downloadlist';
import { withQueryCache, createCacheKey } from '@/lib/cache/queryCache';

// This runs on the server - has access to your existing logic
export async function getMagsList(params: {
    page?: number
    pageSize?: number
    searchTerm?: string
    active_connections?: number
    is_trial?: number
}) {
    const {
        page = 1,
        pageSize = 10,
        searchTerm = '',
        active_connections = null,
        is_trial = null
    } = params

    const offset = (page - 1) * pageSize
    
    // Check session first (required for permission checks)
    const session = await getServerSession();

    if (!session?.user) {
        throw new Error('Not authenticated')
    }

    // Create cache key including user ID (since permissions differ per user)
    const cacheKey = createCacheKey('mags-list', {
        userId: session.user.id,
        page,
        pageSize,
        searchTerm,
        active_connections,
        is_trial,
    });

    // Use request-level cache (prevents duplicate queries in same request)
    return withQueryCache(cacheKey, async () => {
        return executeMagsQuery({
            session,
            page,
            pageSize,
            offset,
            searchTerm,
            active_connections,
            is_trial,
        });
    });
}

async function executeMagsQuery(params: {
    session: any
    page: number
    pageSize: number
    offset: number
    searchTerm: string
    active_connections: number | null
    is_trial: number | null
}) {
    const { session, searchTerm, active_connections, is_trial, offset, pageSize, page } = params;

    try {
        let condition = ""
        if (searchTerm) {
            condition = `AND (users.username LIKE '%${searchTerm}%' OR users.password LIKE '%${searchTerm}%' OR users.reseller_notes LIKE '%${searchTerm}%' OR users.admin_notes LIKE '%${searchTerm}%' OR users.allowed_ips LIKE '%${searchTerm}%' OR users.as_number LIKE '%${searchTerm}%')`
        }

        // Permission check
        if (session.user.level !== 1) {
            condition += ` AND (users.created_by = ${session.user.id} OR users.created_by IN (${session.user.resellers || ''}))`
        }

        if (is_trial !== null) {
            condition += ` AND (users.is_trial = ${is_trial})`
        }

        let having = ''

        if (active_connections !== null) {
            if (parseInt(String(active_connections)) === 1) {
                having += " HAVING `active_connections` > 0"
            } else {
                having += " HAVING `active_connections` <= 0"
            }
        }

        const magQuery = `
            SELECT 
                mag_devices.mag_id, 
                mag_devices.mac,
                users.id, 
                users.member_id, 
                users.created_by, 
                users.username, 
                users.password, 
                users.exp_date, 
                users.admin_enabled, 
                users.enabled, 
                users.admin_notes, 
                users.reseller_notes, 
                users.max_connections, 
                users.is_trial, 
                (SELECT count(*) FROM user_activity_now WHERE users.id = user_activity_now.user_id) AS active_connections,
                (SELECT maa_admin.adm_username FROM maa_admin WHERE users.created_by = maa_admin.adminid) AS owner_name,
                (SELECT reg_users.reseller_dns FROM reg_users WHERE users.created_by = reg_users.id) AS reseller_dns, 
                (SELECT user_ip FROM user_activity_now WHERE users.id = user_activity_now.user_id LIMIT 1) AS user_ip, 
                (SELECT geoip_country_code FROM user_activity_now WHERE users.id = user_activity_now.user_id LIMIT 1) AS geoip_country_code, 
                (SELECT date_start FROM user_activity_now WHERE users.id = user_activity_now.user_id LIMIT 1) AS date_start, 
                (SELECT stream_display_name FROM streams WHERE (SELECT stream_id FROM user_activity_now WHERE users.id = user_activity_now.user_id LIMIT 1) = streams.id LIMIT 1) AS stream_display_name, 
                (SELECT MAX(date_start) FROM user_activity WHERE users.id = user_activity.user_id) AS last_active, 
                packages.package_name 
            FROM mag_devices 
            LEFT JOIN users ON users.id = mag_devices.user_id 
            LEFT JOIN packages ON packages.id = users.pkg 
            WHERE users.is_mag = 1 AND users.is_e2 = 0 ${condition}
            ${having}
            ORDER BY users.id DESC
        `

        // Execute count and data queries in parallel for better performance
        const [countResult, rowsResult, main_server] = await Promise.all([
            db.query(`SELECT COUNT(*) AS user_count FROM (${magQuery}) AS subquery`),
            db.query(magQuery + ` LIMIT ${offset}, ${pageSize}`),
            import('@/lib/cache/streamingServersCache').then(m => m.getStreamingServer())
        ])
        
        const totalCount = Array.isArray(countResult) ? (countResult as any)[0]?.user_count || 0 : 0
        const rows = Array.isArray(rowsResult) ? rowsResult as any[] : []



        if (main_server) {
            let http_broadcast_port = 80
            if (main_server.http_broadcast_port) {
                http_broadcast_port = main_server.http_broadcast_port
            }

            for (const row of rows) {
                if (row.exp_date) {
                    if (row.exp_date * 1000 > Date.now()) {
                        row.is_expired = 0
                    } else {
                        row.is_expired = 1
                    }
                    row.exp_date = row.exp_date * 1000
                } else {
                    row.is_expired = 0
                }

                let rDNS = ""
                if (row.reseller_dns && row.reseller_dns.length > 0) {
                    rDNS = row.reseller_dns
                } else {
                    rDNS = main_server.domain_name ? main_server.domain_name : main_server.server_ip
                }

                const downloadfiles: any[] = []
                for (const list of downloadlist) {
                    let rBefore = ''
                    let rAfter = ''
                    if (list.value === 'type=enigma22_script&output=hls' || list.value === 'type=enigma22_script&output=ts') {
                        rBefore = 'wget -O /etc/enigma2/iptv.sh '
                        rAfter = ' && chmod 777 /etc/enigma2/iptv.sh && /etc/enigma2/iptv.sh'
                    }

                    const download = rBefore + 'http://' + rDNS + ':' + http_broadcast_port + '/get.php?username=' + row.username + '&password=' + row.password + '&' + list.value + rAfter
                    downloadfiles.push({ label: list.label, download: download })
                }

                row.download = downloadfiles
            }
        }

        return {
            rows: rows,
            total: totalCount,
            page,
            pageSize
        }
    } catch (error) {
        console.error('Error in executeMagsQuery:', error)
        throw error
    }
}


/**
 * 
 * do the same cycle for rest of payments pages to be SSR
 * this is the node for each 
 // trans/resellers/page for payments/sub-resellers/page
async function getAllTransResellers(req, res) {
    try {

        const {
            page = 1,
            pageSize = 100,
            searchTerm = {},
        } = req.body;


        const { search_txt = "", admin = 0, type = 2 } = searchTerm;

        const user = req.user;
        const { adminid, level } = user;

        const queries = getAdminQueries(user);


        let rowsPerPage = pageSize;
        let queryCondition = "WHERE T.type=?";
        let params = [];
        params.push(type);

        // Filter by admin
        if (parseInt(admin) !== 0) {

            queryCondition += " AND T.admin=?";
            params.push(admin);
            rowsPerPage = 500;
        }

        // Additional filter (if needed for search or active)
        if (search_txt) {
            queryCondition += " AND (T.Notes LIKE ? OR T.trans_id LIKE ?)";
            params.push(`%${search_txt}%`, `%${search_txt}%`);
        }

        // if (active !== undefined) {
        //     queryCondition += " AND active=?";
        //     params.push(active);
        // }


        const order = "T.dateadded"
        // // Handle order
        const [orderBy, direction] = order.includes(":")
            ? order.split(":")
            : [order, "desc"];

        const limit = rowsPerPage;
        const offset = (page - 1) * rowsPerPage;

        // Main query (fetch paginated results)
        // const [results] = await db.query(
        //     `SELECT * FROM maa_trans ${queryCondition}   ORDER BY ${orderBy} LIMIT ?, ?`,
        //     [...params, offset, limit]
        // );


        const [results] = await db.query(
            `SELECT T.*, A.admin_name AS admin_name
     FROM maa_trans T
     LEFT JOIN maa_admin A ON A.adminid = T.admin
     ${queryCondition} ${queries.qry_sub}
     ORDER BY trans_id DESC 
     LIMIT ?, ?`,
            [...params, offset, rowsPerPage]
        );


        // Count total rows
        const [totalResult] = await db.query(
            `SELECT COUNT(*) as total FROM maa_trans T ${queryCondition} ${queries.qry_sub}  `,
            params
        );

        res.json({
            success: true,
            result: results,
            totalLength: totalResult[0].total,
            currentPage: parseInt(page),
            rowsPerPage,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
        
}

// Admin query builder function (as above)
function getAdminQueries(admin) {
    const adminid = parseInt(admin.adminid, 10);
    const queries = {
        qry_admin: "",
        qry_admin_where: "",
        qry_admin_father: "",
        qryWhereFather: "",
        qry_sub: "",
        qry_sub_for_dropdown: ""
    };

    if (admin.level === 1) {
        queries.qry_admin = " AND isSub=0 ";
        queries.qry_sub = " AND isSub=1 ";
        queries.qryWhereFather = " WHERE father=0 ";
    } else {
        queries.qry_admin_father = ` AND admin_father='${adminid}' `;
        queries.qryWhereFather = ` WHERE father=${adminid} `;
        queries.qry_sub = ` AND admin_father='${adminid}' `;
        queries.qry_sub_for_dropdown = ` (adminid='${adminid}' OR father=${adminid} OR main_father=${adminid}) `;
        queries.qry_admin = ` AND admin=${adminid} `;
        queries.qry_admin_where = ` WHERE admin=${adminid} `;
    }

    return queries;
}


for /trans/sub-invoices/page/  payments/sub-invoices/page

const getAllSubInvoices = async (req, res) => {

    try {
        // 1. Extract query parameters
        let {
            page = 1,
            order = 'trans_id:desc',
            pageSize = 30,
            searchTerm = {},
            date1,
            date2,
            view_sub = 0
        } = req.body;

        let { search_txt = "", admin = 0, type = 2, } = searchTerm;

        const user = req.user;
        const queries = getAdminQueries(user);

        // 2. Sanitize / defaults
        page = parseInt(page, 10);
        admin = parseInt(admin, 10);
        view_sub = parseInt(view_sub, 10);
        order = order.replace(':', ' '); // convert "trans_id:desc" to "trans_id desc"

        let rows_per_page = pageSize;
        let filters = [];
        let params = [];

        // 3. Admin / Sub-admin filters
        if (admin !== 0) {
            if (view_sub === 0) {
                filters.push('(T.admin = ? OR T.admin_father = ?)');
                params.push(admin, admin);
            } else if (view_sub === 1) {
                filters.push(`(
                    T.admin_father = ? OR T.admin = ? OR 
                    admin IN (
                        SELECT adminid FROM maa_admin 
                        WHERE father = ? OR main_father = ?
                    )
                )`);
                params.push(admin, admin, admin, admin);
            }
        }

        // 4. Date filter
        if (date1 && date2) {
            filters.push(`T.dateadded BETWEEN ? AND ?`);
            params.push(`${date1} 00:00:00`, `${date2} 23:59:59`);
        }

        // 5. Notes filter (optional)
        if (search_txt) {
            filters.push(`T.Notes LIKE ? OR T.trans_id LIKE ?`);
            params.push(`%${search_txt}%`, `%${search_txt}%`);
        }

        // 6. Build WHERE clause
        let whereClause = 'WHERE T.type = 1';
        if (filters.length > 0) {
            whereClause += ' AND ' + filters.join(' AND ');
        }

        // 7. Pagination
        const offset = (page - 1) * rows_per_page;

        // 8. Main query
        const sql = `
            SELECT T.*, A.admin_name AS admin_name
         FROM maa_trans T 
          LEFT JOIN maa_admin A ON A.adminid = T.admin 
            ${whereClause} 
${queries.qry_sub}
            ORDER BY ${order}
            LIMIT ?, ?
        `;

        const [invoices] = await db.query(sql, [...params, offset, rows_per_page]);

        // 9. Total count
        const totalSql = `
            SELECT COUNT(*) AS total 
            FROM maa_trans T 
          LEFT JOIN maa_admin A ON A.adminid = T.admin 
            ${whereClause} 
${queries.qry_sub}

        `;
        const [totalResult] = await db.query(totalSql, params);

        const totalRows = totalResult[0].total;

        // 10. Sum of depit
        const sumSql = `
            SELECT SUM(depit) AS total_amount 
            FROM maa_trans T 
          LEFT JOIN maa_admin A ON A.adminid = T.admin 
              ${whereClause}  ${queries.qry_sub}
            ORDER BY ${order}
            LIMIT ?, ?
        `;

        const [sumResult] = await db.query(sumSql, [...params, offset, rows_per_page]);

        // 11. Send JSON response
        res.json({
            success: true,
            total: totalRows,
            page,
            perPage: rows_per_page,
            result: invoices,

            total_amount: sumResult[0].total_amount || 0
        });

    } catch (err) {
        console.error('Error in getAllSubInvoices:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


for /trans/invoices/page/  payments/invoices/page
const getAllInvoicesList = async (req, res) => {

    try {
        // Get query params
        let {
            page = 1,
            pageSize = 100,
            order = 'trans_id:desc',
            Notes = '',
            date1 = '',
            date2 = '',
            admin = 0,
            depit
        } = req.query;


        const user = req.user;
        const queries = getAdminQueries(user);

        page = parseInt(page) || 1;
        admin = parseInt(admin) || 0;

        // Clean input (like _clean in PHP)
        Notes = Notes.trim();
        date1 = date1.trim();
        date2 = date2.trim();

        // Depit handling
        if (depit !== '-') {
            depit = depit ? parseFloat(depit) : '';
        }

        // Query building
        let whereClauses = ["T.type = 1"];
        let rowsPerPage = pageSize;

        if (Notes) {
            whereClauses.push(`T.Notes LIKE ?`);
        }
        if (admin !== 0) {
            whereClauses.push(`T.admin = ?`);
            // rowsPerPage = pageSize * 5;
        }
        if (date1 && date2) {
            whereClauses.push(`T.dateadded BETWEEN ? AND ?`);
            // rowsPerPage = 5000;
        }
        if (depit > 0) {
            whereClauses.push(`T.depit = ?`);
            // rowsPerPage = 500;
        } else if (depit === '-') {
            whereClauses.push(`T.depit < 0`);
            // rowsPerPage = 500;
        }

        // Order
        order = order.replace(':', ' ');

        // Pagination
        const offset = (page - 1) * rowsPerPage;

        // Build SQL
        const whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';
        const sql = `SELECT  T.*, A.admin_name AS admin_name
         FROM maa_trans T 
          LEFT JOIN maa_admin A ON A.adminid = T.admin
          ${whereSQL}  ${queries.qry_admin} ORDER BY ${order} LIMIT ?, ?`;
        const sqlCount = `SELECT COUNT(*) AS total FROM maa_trans T ${whereSQL}   ${queries.qry_admin} `;

        // Parameters
        let params = [];
        if (Notes) params.push(`%${Notes}%`);
        if (admin !== 0) params.push(admin);
        if (date1 && date2) {
            params.push(date1, date2);
        }
        if (depit > 0) {
            params.push(depit);
        }
        // Pagination params
        const paramsWithLimit = [...params, offset, rowsPerPage];

        // Execute queries
        const [rows] = await db.query(sql, paramsWithLimit);
        const [countRows] = await db.query(sqlCount, params);

        res.json({
            total: countRows[0].total,
            page,
            perPage: rowsPerPage,
            result: rows
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error fetching invoices' });
    }
};

 */