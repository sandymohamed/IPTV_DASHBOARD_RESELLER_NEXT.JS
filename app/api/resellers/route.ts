// app/api/resellers/route.ts
import { db } from '@/lib/db';
import { getServerSession } from '@/lib/auth/auth';

// Helper function to get country ISO (placeholder - implement if needed)
async function getCountryISO(ip: string): Promise<string> {
  // TODO: Implement IP to country ISO lookup
  // For now, return empty string
  return '';
}

// This runs on the server - has access to your existing logic
export async function getSubResellersList(params: {
  page?: number;
  pageSize?: number;
  searchTerm?: { username?: string; admin_name?: string };
}) {
  const {
    page = 1,
    pageSize = 10,
    searchTerm = {},
  } = params;

  const session = await getServerSession();

  if (!session?.user) {
    throw new Error('Not authenticated');
  }

  const owner = session.user.adminid;

  try {
    let pagination = page - 1;
    let qry = '';

    if (searchTerm?.username) {
      const searchUser = searchTerm.username.replace('*', '%').replace(/['";\\]/g, '');
      qry += ` AND maa_admin.adm_username LIKE '%${searchUser}%'`;
    }

    if (searchTerm?.admin_name) {
      const searchReselName = searchTerm.admin_name.replace('*', '%').replace(/['";\\]/g, '');
      qry += ` AND maa_admin.admin_name LIKE '%${searchReselName}%'`;
    }

    let pag = '';
    if (page && pageSize) {
      pag += ` LIMIT ${pageSize} OFFSET ${pagination}`;
    }

    const query = `SELECT 
      maa_admin.*, 
      mgroups.group_name,
      COUNT(DISTINCT users.id) AS user_count, 
      COUNT(DISTINCT resellers.adminid) AS resellers_count, 
      parent.adm_username AS reseller_father, 
      main_parent.adm_username AS main_reseller_father, 
      (SELECT SUM(credit - depit) FROM maa_trans WHERE admin = maa_admin.adminid) AS balance
    FROM maa_admin
    LEFT JOIN users ON users.created_by = maa_admin.adminid
    LEFT JOIN maa_admin AS resellers ON resellers.father = maa_admin.adminid
    LEFT JOIN maa_admin AS parent ON parent.adminid = maa_admin.father
    LEFT JOIN maa_admin AS main_parent ON main_parent.adminid = maa_admin.main_father
    LEFT JOIN member_groups mgroups ON mgroups.group_id = maa_admin.member_group_id
    WHERE maa_admin.father = ${owner} ${qry}
    GROUP BY maa_admin.adminid
    ORDER BY maa_admin.adminid ASC
    ${pag}`;

    const rows = await db.query(query) as any[];

    if (!rows || rows.length === 0) {
      return {
        success: true,
        result: [],
        totalLength: 0,
      };
    }

    // Process rows to add country ISO if needed and remove non-serializable fields
    for (const row of rows) {
      if (row.allowed_ips && row.allowed_ips !== '') {
        const country = await getCountryISO(row.allowed_ips);
        row.countryISO = country;
      }
      // Remove logo field (Uint8Array) as it cannot be serialized for Client Components
      // If logo is needed, convert it to base64 string instead: Buffer.from(row.logo).toString('base64')
      if (row.logo !== undefined) {
        delete row.logo;
      }
    }

    // Get total count with search filters
    let countQry = '';
    if (searchTerm?.username) {
      const searchUser = searchTerm.username.replace('*', '%').replace(/['";\\]/g, '');
      countQry += ` AND maa_admin.adm_username LIKE '%${searchUser}%'`;
    }
    if (searchTerm?.admin_name) {
      const searchReselName = searchTerm.admin_name.replace('*', '%').replace(/['";\\]/g, '');
      countQry += ` AND maa_admin.admin_name LIKE '%${searchReselName}%'`;
    }
    const countQuery = `SELECT COUNT(*) as count FROM maa_admin WHERE maa_admin.father = ${owner} ${countQry}`;
    const countResult = await db.query(countQuery) as any[];
    const totalLength = countResult[0]?.count || 0;

    return {
      success: true,
      result: rows,
      totalLength: totalLength,
    };
  } catch (error) {
    console.error('Error in getSubResellersList:', error);
    throw error;
  }
}

