// app/api/client-connection/route.ts
import { db } from '@/lib/db';
import { getServerSession } from '@/lib/auth/auth';

export async function getClientConnections(params: {
  page?: number;
  pageSize?: number;
}) {
  const {
    page = 1,
    pageSize = 100,
  } = params;

  const pagination = (page - 1) * pageSize;

  // Check session first (required for permission checks)
  const session = await getServerSession();
  if (!session?.user) {
    throw new Error('Not authenticated');
  }

  const adminid = session.user.adminid || session.user.id;

  try {
    // Count query
    const countQuery = `
      SELECT count(*) as count 
      FROM user_activity_now 
      LEFT JOIN users ON user_activity_now.user_id = users.id 
      WHERE users.created_by = ?
    `;

    // Main query
    const query = `
      SELECT 
        user_activity_now.divergence, 
        user_activity_now.user_id, 
        user_activity_now.user_ip, 
        user_activity_now.stream_id, 
        user_activity_now.server_id, 
        user_activity_now.user_agent, 
        user_activity_now.container, 
        user_activity_now.date_start, 
        user_activity_now.geoip_country_code, 
        users.username, 
        streams.stream_display_name, 
        streams.type 
      FROM user_activity_now 
      LEFT JOIN users ON user_activity_now.user_id = users.id 
      LEFT JOIN streams ON user_activity_now.stream_id = streams.id 
      WHERE users.created_by = ? 
      LIMIT ?, ?
    `;

    // Execute queries in parallel for better performance
    const [countResult, rowsResult] = await Promise.all([
      db.query(countQuery, [adminid]),
      db.query(query, [adminid, pagination, pageSize]),
    ]);

    const count = Array.isArray(countResult) && countResult.length > 0 
      ? (countResult[0] as any).count 
      : 0;

    const rows = Array.isArray(rowsResult) ? rowsResult : [];

    return {
      success: true,
      result: rows,
      total: count,
      pagination: count,
    };
  } catch (error) {
    console.error('Error fetching client connections:', error);
    throw error;
  }
}

