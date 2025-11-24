// app/api/codes/route.ts
import { db } from '@/lib/db';
import { getServerSession } from '@/lib/auth/auth';

// This runs on the server - has access to your existing logic
export async function fetchTransactionsList(params: {
  page?: number;
  pageSize?: number;
  name?: string;
  admin?: number;
  date1?: string;
  date2?: string;
  id?: number;
  order?: string;
}) {
  const {
    page = 1,
    pageSize = 10,
    name,
    admin,
    date1,
    date2,
    id,
    order,
  } = params;

  const session = await getServerSession();

  if (!session?.user) {
    throw new Error('Not authenticated');
  }

  const user = session.user;

  try {
    let qry = 'WHERE 1=1';
    const paramsArray: any[] = [];

    // Filter by user level
    if (user.level !== 1) {
      qry += ` AND (tr.adminid=${user.adminid})`;
    }

    if (name) {
      const searchName = name.replace(/['";\\]/g, '');
      qry += ' AND tr.trans_name LIKE ?';
      paramsArray.push(`%${searchName}%`);
    }

    if (admin) {
      qry += ' AND tr.adminid = ?';
      paramsArray.push(admin);
    }

    if (date1 && date2) {
      qry += ' AND tr.trans_date BETWEEN UNIX_TIMESTAMP(?) AND UNIX_TIMESTAMP(?)';
      paramsArray.push(`${date1} 00:00:00`, `${date2} 23:59:59`);
    }

    if (id) {
      qry = 'WHERE tr.trans_id = ?';
      paramsArray.length = 0; // reset
      paramsArray.push(id);
    }

    // Order
    let orderBy = 'tr.trans_id DESC';
    if (order) {
      const [col, dir] = order.split(':');
      orderBy = `${col} ${dir.toUpperCase()}`;
    }

    const offset = (page - 1) * pageSize;

    // Main query
    const query = `SELECT tr.*,
              (SELECT COUNT(id) FROM maa_codes WHERE transid=tr.trans_id) AS totCodes,
              (SELECT COUNT(id) FROM maa_codes WHERE status=1 AND transid=tr.trans_id) AS totAct,
              maa_admin.admin_name
       FROM maa_codes_trans tr
       LEFT JOIN maa_admin ON tr.adminid = maa_admin.adminid
       ${qry}
       ORDER BY ${orderBy}
       LIMIT ${pageSize} OFFSET ${offset}`;

    const rows = await db.query(query, paramsArray) as any[];

    // Count query
    const countQuery = `SELECT COUNT(*) as total FROM maa_codes_trans tr ${qry}`;
    const countResult = await db.query(countQuery, paramsArray) as any[];
    const totalLength = countResult[0]?.total || 0;

    return {
      rows,
      totalLength,
    };
  } catch (error) {
    console.error('Error in fetchTransactionsList:', error);
    throw error;
  }
}

