// app/api/enigmas/route.ts
import { db } from '@/lib/db';
import { getServerSession } from '@/lib/auth/auth';
import { downloadlist } from '@/lib/utils/downloadlist';

// This runs on the server - has access to your existing logic
export async function getEnigmasList(params: {
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
    const session = await getServerSession();

    if (!session?.user) {
        throw new Error('Not authenticated')
    }

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

        const eQuery = `
            SELECT 
                enigma2_devices.device_id, 
                enigma2_devices.mac,
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
            FROM enigma2_devices 
            LEFT JOIN users ON users.id = enigma2_devices.user_id 
            LEFT JOIN packages ON packages.id = users.pkg 
            WHERE users.is_mag = 0 AND users.is_e2 = 1 ${condition}
            ${having}
            ORDER BY users.id DESC
        `

        // Get total count
        const countResult: any = await db.query(
            `SELECT COUNT(*) AS user_count FROM (${eQuery}) AS subquery`
        )
        const totalCount = countResult[0]?.user_count || 0

        // Get paginated data
        const rowsResult: any = await db.query(eQuery + ` LIMIT ${offset}, ${pageSize}`)
        const rows = rowsResult || []

        // Get streaming servers for download links
        const [servers]: any = await db.query(`SELECT * FROM streaming_servers ORDER BY id ASC LIMIT 1`)


        if (servers && servers.length > 0) {
            const main_server = servers[0]
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
                    // Format date for enigma (reformatDate equivalent)
                    const date = new Date(row.exp_date * 1000)
                    row.exp_date = date.toISOString()
                } else {
                    row.is_expired = 0
                }

                let rDNS = ""
                if (row.reseller_dns && row.reseller_dns.length > 0) {
                    rDNS = row.reseller_dns
                } else {
                    rDNS = main_server.server_ip
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
        console.error('Error in getEnigmasList:', error)
        throw error
    }
}

