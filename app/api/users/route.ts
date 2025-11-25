// app/api/users/route.ts
// import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db';
import { getServerSession } from '@/lib/auth/auth';
import { downloadlist } from '@/lib/utils/downloadlist';
import { withQueryCache, createCacheKey } from '@/lib/cache/queryCache';


// This runs on the server - has access to your existing logic
export async function getUsersList(params: {
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
    throw new Error('Not authenticated');
  }

  // Create cache key including user ID (since permissions differ per user)
  const cacheKey = createCacheKey('users-list', {
    userId: session.user.id,
    page,
    pageSize,
    searchTerm,
    active_connections,
    is_trial,
  });

  // Use request-level cache (prevents duplicate queries in same request)
  // Note: We don't cache across requests since data is user-specific and changes frequently
  return withQueryCache(cacheKey, async () => {
    return executeUsersQuery({
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

async function executeUsersQuery(params: {
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
      condition = `AND (user.username LIKE '%${searchTerm}%' OR user.password LIKE '%${searchTerm}%' OR user.reseller_notes LIKE '%${searchTerm}%' OR user.allowed_ips LIKE '%${searchTerm}%' OR user.id LIKE '%${searchTerm}%')`
    }

    if (is_trial !== null) {
      condition += ` AND (user.is_trial = ${is_trial})`
    }

    let having = ""

    if (active_connections !== null) {
      if (Number(active_connections) === 1) {
        having += " HAVING `active_connections` > 0"
      } else {
        having += " HAVING `active_connections` <= 0"
      }
    }

    // Permission check
    if (session.user.level !== 1) {
      const resellers = session.user.resellers;
      if (resellers && Array.isArray(resellers) && resellers.length > 0) {
        const resellerIds = resellers.join(',');
        condition += ` AND (user.created_by = ${session.user.id} OR user.created_by IN (${resellerIds}))`
      } else {
        condition += ` AND user.created_by = ${session.user.id}`
      }
    }

    const query = `
      SELECT
        user.id,
        user.username,
        user.password,
        user.enabled,
        user.is_mag,
        user.is_e2,
        user.member_id,
        user.created_by,
        user.is_trial,
        user.reseller_notes,
        user.allowed_ips,
        user.exp_date,
        user.pkg,
        user.pkid,
        ud.fullname AS user_fullname,
        MAX(active_users.user_ip) AS user_ip,
        MAX(active_users.geoip_country_code) AS geoip_country_code,
        MAX(active_users.date_start) AS date_start,
        MAX(active_users.stream_id) AS stream_id,
        packages.package_name,
        packages.max_connections,
        COUNT(active_users.user_id) AS active_connections,
        maa_admin.member_group_id AS reselPkg,
        owner.adm_username AS owner_name,
        MAX(streams.stream_display_name) AS stream_display_name,

        IFNULL(
          ROUND(
            (
              COALESCE(SUM(active_users.divergence), 0) * 1048576 * 8.0
            )
            /
            NULLIF(
              SUM(
                GREATEST(
                  LEAST(
                    COALESCE(
                      NULLIF(active_users.hls_last_read, 0),
                      IF(active_users.hls_end = 0, UNIX_TIMESTAMP(), NULL),
                      active_users.date_start
                    ) - active_users.date_start,
                    300
                  ),
                  1
                )
              ),
              0
            )
            / 1000.0,
            2
          ),
        0) AS speed_Kbps,

        IFNULL(
          ROUND(
            (
              COALESCE(SUM(active_users.divergence), 0) * 1048576 * 8.0
            )
            /
            NULLIF(
              SUM(
                GREATEST(
                  LEAST(
                    COALESCE(
                      NULLIF(active_users.hls_last_read, 0),
                      IF(active_users.hls_end = 0, UNIX_TIMESTAMP(), NULL),
                      active_users.date_start
                    ) - active_users.date_start,
                    300
                  ),
                  1
                )
              ),
              0
            )
            / 1000000.0,
            3
          ),
        0) AS speed_Mbps

      FROM users user
      LEFT JOIN maa_users_data ud ON user.id = ud.userid
      LEFT JOIN packages ON packages.id = user.pkg OR packages.id = user.pkid
      LEFT JOIN user_activity_now AS active_users ON user.id = active_users.user_id
      LEFT JOIN maa_admin ON maa_admin.adminid = user.member_id
      LEFT JOIN maa_admin AS owner ON user.created_by = owner.adminid
      LEFT JOIN streams ON active_users.stream_id = streams.id
      WHERE user.is_mag = 0 AND user.is_e2 = 0 ${condition}
      GROUP BY user.id
      ${having}
      ORDER BY user.id DESC
    `
    // Get total count
    const countResult: any = await db.query(`SELECT COUNT(*) AS user_count FROM (${query}) AS subquery`)

    // ✅ CORRECT: Access the first element of the array
    const totalCount = countResult[0]?.user_count

    // Get paginated data
    // const [rows]: any = await db.query(query + ` LIMIT ${offset}, ${pageSize}`)

    const rowsResult: any = await db.query(query + ` LIMIT ${offset}, ${pageSize}`)
    const rows = rowsResult;


    // Get streaming servers for download links
    const streaming_servers: any = await db.query(`SELECT * FROM streaming_servers ORDER BY id ASC LIMIT 1`)

    if (streaming_servers && streaming_servers.length > 0) {
      const main_server = streaming_servers[0]
      const http_broadcast_port = main_server.http_broadcast_port || 80

      for (const row of rows) {
        // Process expiration
        if (row.exp_date) {
          row.is_expired = row.exp_date * 1000 > Date.now() ? 0 : 1
          row.exp_date = row.exp_date * 1000
        } else {
          row.is_expired = 0
        }

        // Process download links
        const rDNS = main_server.domain_name || main_server.server_ip
        const downloadfiles = []

        for (const list of downloadlist) {
          let rBefore = ""
          let rAfter = ""

          if (list.value === "type=enigma22_script&output=hls" ||
            list.value === "type=enigma22_script&output=ts") {
            rBefore = "wget -O /etc/enigma2/iptv.sh "
            rAfter = "&& chmod 777 /etc/enigma2/iptv.sh && /etc/enigma2/iptv.sh"
          }

          const download =
            rBefore +
            "http://" +
            rDNS +
            ":" +
            http_broadcast_port +
            "/get.php?username=" +
            row.username +
            "&password=" +
            row.password +
            "&" +
            list.value +
            rAfter

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
    console.error('Error fetching users:', error)
    throw error
  }
}




// export async function GET(request: NextRequest) {
//     try {
//         const session = await getServerSession()

//         if (!session) {
//             return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
//         }

//         const { searchParams } = new URL(request.url)
//         const page = parseInt(searchParams.get('page') || '1')
//         const pageSize = parseInt(searchParams.get('pageSize') || '10')
//         const searchTerm = searchParams.get('search') || ''
//         const active_connections = searchParams.get('active_connections')
//         const is_trial = searchParams.get('is_trial')

//         // Use the same getUsersList function from above
//         const usersData = await getUsersList({
//             page,
//             pageSize,
//             searchTerm,
//             active_connections: active_connections ? parseInt(active_connections) : 0,
//             is_trial: is_trial ? parseInt(is_trial) : 0
//         })

//         return NextResponse.json(usersData)
//     } catch (error) {
//         return NextResponse.json(
//             { error: 'Internal server error' },
//             { status: 500 }
//         )
//     }
// }