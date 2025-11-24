// app/api/payments/route.ts
import { db } from '@/lib/db';
import { getServerSession } from '@/lib/auth/auth';

// Helper function to get admin queries based on user level
function getAdminQueries(user: { adminid: number; level: number }) {
  const adminid = parseInt(String(user.adminid), 10);
  const queries: {
    qry_admin: string;
    qry_admin_where: string;
    qry_admin_father: string;
    qryWhereFather: string;
    qry_sub: string;
    qry_sub_for_dropdown: string;
  } = {
    qry_admin: '',
    qry_admin_where: '',
    qry_admin_father: '',
    qryWhereFather: '',
    qry_sub: '',
    qry_sub_for_dropdown: '',
  };

  if (user.level === 1) {
    queries.qry_admin = ' AND isSub=0 ';
    queries.qry_sub = ' AND isSub=1 ';
    queries.qryWhereFather = ' WHERE father=0 ';
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

// This runs on the server - has access to your existing logic
export async function getAllTransactions(params: {
  page?: number;
  pageSize?: number;
  searchTerm?: { search_txt?: string; admin?: number; type?: number };
}) {
  const {
    page = 1,
    pageSize = 100,
    searchTerm = {},
  } = params;

  const { search_txt = '', admin = 0, type = 2 } = searchTerm;

  const session = await getServerSession();

  if (!session?.user) {
    throw new Error('Not authenticated');
  }

  const user = session.user;
  const queries = getAdminQueries({
    adminid: parseInt(String(user.adminid || 0), 10),
    level: (user as any).level || 0,
  });

  try {
    let rowsPerPage = pageSize;
    let queryCondition = 'WHERE T.type=?';
    const paramsArray: any[] = [];
    paramsArray.push(type);

    // Filter by admin
    if (parseInt(String(admin)) !== 0) {
      queryCondition += ' AND T.admin=?';
      paramsArray.push(admin);
      rowsPerPage = 500;
    }

    // Additional filter for search
    if (search_txt) {
      const searchText = search_txt.replace(/['";\\]/g, '');
      queryCondition += ' AND (T.Notes LIKE ? OR T.trans_id LIKE ?)';
      paramsArray.push(`%${searchText}%`, `%${searchText}%`);
    }

    const order = 'T.dateadded';
    const [orderBy, direction] = order.includes(':') ? order.split(':') : [order, 'desc'];

    const limit = rowsPerPage;
    const offset = (page - 1) * rowsPerPage;

    // Main query
    const query = `SELECT T.*, A.admin_name AS admin_name
     FROM maa_trans T
     LEFT JOIN maa_admin A ON A.adminid = T.admin
     ${queryCondition} ${queries.qry_admin}
     ORDER BY trans_id DESC 
     LIMIT ${limit} OFFSET ${offset}`;

    const results = await db.query(query, paramsArray) as any[];

    // Count total rows
    const countQuery = `SELECT COUNT(*) as total FROM maa_trans T ${queryCondition} ${queries.qry_admin}`;
    const totalResult = await db.query(countQuery, paramsArray) as any[];

    return {
      success: true,
      result: results,
      totalLength: totalResult[0]?.total || 0,
      currentPage: parseInt(String(page)),
      rowsPerPage,
    };
  } catch (error) {
    console.error('Error in getAllTransactions:', error);
    throw error;
  }
}

// For /payments/sub-resellers/page
export async function getAllTransResellers(params: {
  page?: number;
  pageSize?: number;
  searchTerm?: { search_txt?: string; admin?: number; type?: number };
}) {
  const {
    page = 1,
    pageSize = 100,
    searchTerm = {},
  } = params;

  const { search_txt = '', admin = 0, type = 2 } = searchTerm;

  const session = await getServerSession();

  if (!session?.user) {
    throw new Error('Not authenticated');
  }

  const user = session.user;
  const queries = getAdminQueries({
    adminid: parseInt(String(user.adminid || 0), 10),
    level: (user as any).level || 0,
  });

  try {
    let rowsPerPage = pageSize;
    let queryCondition = 'WHERE T.type=?';
    const paramsArray: any[] = [];
    paramsArray.push(type);

    // Filter by admin
    if (parseInt(String(admin)) !== 0) {
      queryCondition += ' AND T.admin=?';
      paramsArray.push(admin);
      rowsPerPage = 500;
    }

    // Additional filter for search
    if (search_txt) {
      const searchText = search_txt.replace(/['";\\]/g, '');
      queryCondition += ' AND (T.Notes LIKE ? OR T.trans_id LIKE ?)';
      paramsArray.push(`%${searchText}%`, `%${searchText}%`);
    }

    const order = 'T.dateadded';
    const [orderBy, direction] = order.includes(':') ? order.split(':') : [order, 'desc'];

    const limit = rowsPerPage;
    const offset = (page - 1) * rowsPerPage;

    // Main query
    const query = `SELECT T.*, A.admin_name AS admin_name
     FROM maa_trans T
     LEFT JOIN maa_admin A ON A.adminid = T.admin
     ${queryCondition} ${queries.qry_sub}
     ORDER BY trans_id DESC 
     LIMIT ${limit} OFFSET ${offset}`;

    const results = await db.query(query, paramsArray) as any[];

    // Count total rows
    const countQuery = `SELECT COUNT(*) as total FROM maa_trans T ${queryCondition} ${queries.qry_sub}`;
    const totalResult = await db.query(countQuery, paramsArray) as any[];

    return {
      success: true,
      result: results,
      totalLength: totalResult[0]?.total || 0,
      currentPage: parseInt(String(page)),
      rowsPerPage,
    };
  } catch (error) {
    console.error('Error in getAllTransResellers:', error);
    throw error;
  }
}

// For /payments/sub-invoices/page
export async function getAllSubInvoices(params: {
  page?: number;
  pageSize?: number;
  order?: string;
  searchTerm?: { search_txt?: string; admin?: number; type?: number };
  date1?: string;
  date2?: string;
  view_sub?: number;
}) {
  const {
    page = 1,
    order = 'trans_id:desc',
    pageSize = 30,
    searchTerm = {},
    date1,
    date2,
    view_sub = 0,
  } = params;

  let { search_txt = '', admin = 0, type = 2 } = searchTerm;

  const session = await getServerSession();

  if (!session?.user) {
    throw new Error('Not authenticated');
  }

  const user = session.user;
  const queries = getAdminQueries({
    adminid: parseInt(String(user.adminid || 0), 10),
    level: (user as any).level || 0,
  });

  try {
    // Sanitize / defaults
    const pageNum = parseInt(String(page), 10);
    const adminNum = parseInt(String(admin), 10);
    const viewSubNum = parseInt(String(view_sub), 10);
    const orderBy = order.replace(':', ' '); // convert "trans_id:desc" to "trans_id desc"

    let rows_per_page = pageSize;
    const filters: string[] = [];
    const paramsArray: any[] = [];

    // Admin / Sub-admin filters
    if (adminNum !== 0) {
      if (viewSubNum === 0) {
        filters.push('(T.admin = ? OR T.admin_father = ?)');
        paramsArray.push(adminNum, adminNum);
      } else if (viewSubNum === 1) {
        filters.push(`(
          T.admin_father = ? OR T.admin = ? OR 
          admin IN (
            SELECT adminid FROM maa_admin 
            WHERE father = ? OR main_father = ?
          )
        )`);
        paramsArray.push(adminNum, adminNum, adminNum, adminNum);
      }
    }

    // Date filter
    if (date1 && date2) {
      filters.push(`T.dateadded BETWEEN ? AND ?`);
      paramsArray.push(`${date1} 00:00:00`, `${date2} 23:59:59`);
    }

    // Notes filter
    if (search_txt) {
      const searchText = search_txt.replace(/['";\\]/g, '');
      filters.push(`(T.Notes LIKE ? OR T.trans_id LIKE ?)`);
      paramsArray.push(`%${searchText}%`, `%${searchText}%`);
    }

    // Build WHERE clause
    let whereClause = 'WHERE T.type = 1';
    if (filters.length > 0) {
      whereClause += ' AND ' + filters.join(' AND ');
    }

    // Pagination
    const offset = (pageNum - 1) * rows_per_page;

    // Main query
    const sql = `
      SELECT T.*, A.admin_name AS admin_name
      FROM maa_trans T 
      LEFT JOIN maa_admin A ON A.adminid = T.admin 
      ${whereClause} 
      ${queries.qry_sub}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;

    const invoices = await db.query(sql, [...paramsArray, rows_per_page, offset]) as any[];

    // Total count
    const totalSql = `
      SELECT COUNT(*) AS total 
      FROM maa_trans T 
      LEFT JOIN maa_admin A ON A.adminid = T.admin 
      ${whereClause} 
      ${queries.qry_sub}
    `;
    const totalResult = await db.query(totalSql, paramsArray) as any[];
    const totalRows = totalResult[0]?.total || 0;

    // Sum of depit (only for current page results)
    const sumSql = `
      SELECT SUM(depit) AS total_amount 
      FROM maa_trans T 
      LEFT JOIN maa_admin A ON A.adminid = T.admin 
      ${whereClause}  ${queries.qry_sub}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;
    const sumResult = await db.query(sumSql, [...paramsArray, rows_per_page, offset]) as any[];

    return {
      success: true,
      total: totalRows,
      page: pageNum,
      perPage: rows_per_page,
      result: invoices,
      total_amount: sumResult[0]?.total_amount || 0,
    };
  } catch (error) {
    console.error('Error in getAllSubInvoices:', error);
    throw error;
  }
}

// For /payments/invoices/page
export async function getAllInvoicesList(params: {
  page?: number;
  pageSize?: number;
  order?: string;
  Notes?: string;
  date1?: string;
  date2?: string;
  admin?: number;
  depit?: string | number;
}) {
  const {
    page = 1,
    pageSize = 100,
    order = 'trans_id:desc',
    Notes = '',
    date1 = '',
    date2 = '',
    admin = 0,
    depit,
  } = params;

  const session = await getServerSession();

  if (!session?.user) {
    throw new Error('Not authenticated');
  }

  const user = session.user;
  const queries = getAdminQueries({
    adminid: parseInt(String(user.adminid || 0), 10),
    level: (user as any).level || 0,
  });

  try {
    const pageNum = parseInt(String(page)) || 1;
    const adminNum = parseInt(String(admin)) || 0;

    // Clean input
    const notesTrimmed = Notes.trim();
    const date1Trimmed = date1.trim();
    const date2Trimmed = date2.trim();

    // Depit handling
    let depitValue: number | string | undefined = depit;
    if (depit !== '-' && depit !== undefined) {
      depitValue = depit ? parseFloat(String(depit)) : '';
    }

    // Query building
    const whereClauses: string[] = ['T.type = 1'];
    let rowsPerPage = pageSize;
    const paramsArray: any[] = [];

    if (notesTrimmed) {
      whereClauses.push(`T.Notes LIKE ?`);
      paramsArray.push(`%${notesTrimmed}%`);
    }
    if (adminNum !== 0) {
      whereClauses.push(`T.admin = ?`);
      paramsArray.push(adminNum);
    }
    if (date1Trimmed && date2Trimmed) {
      whereClauses.push(`T.dateadded BETWEEN ? AND ?`);
      paramsArray.push(date1Trimmed, date2Trimmed);
    }
    if (typeof depitValue === 'number' && depitValue > 0) {
      whereClauses.push(`T.depit = ?`);
      paramsArray.push(depitValue);
    } else if (depitValue === '-') {
      whereClauses.push(`T.depit < 0`);
    }

    // Order
    const orderBy = order.replace(':', ' ');

    // Pagination
    const offset = (pageNum - 1) * rowsPerPage;

    // Build SQL
    const whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const sql = `SELECT  T.*, A.admin_name AS admin_name
     FROM maa_trans T 
     LEFT JOIN maa_admin A ON A.adminid = T.admin
     ${whereSQL}  ${queries.qry_admin} ORDER BY ${orderBy} LIMIT ${rowsPerPage} OFFSET ${offset}`;
    const sqlCount = `SELECT COUNT(*) AS total FROM maa_trans T ${whereSQL}   ${queries.qry_admin} `;

    // Execute queries
    const rows = await db.query(sql, paramsArray) as any[];
    const countRows = await db.query(sqlCount, paramsArray) as any[];

    return {
      total: countRows[0]?.total || 0,
      page: pageNum,
      perPage: rowsPerPage,
      result: rows,
    };
  } catch (error) {
    console.error('Error in getAllInvoicesList:', error);
    throw error;
  }
}
