// app/api/mags/route.ts
import { db } from '@/lib/db';
import { getServerSession } from '@/lib/auth/auth';
import { downloadlist } from '@/lib/utils/downloadlist';

// This runs on the server - has access to your existing logic
export async function getTemplatesList(params: {
    page?: number
    pageSize?: number
    searchTerm?: string
}) {
    const {
        page = 1,
        pageSize = 10,
        searchTerm = '',
    } = params

    const offset = (page - 1) * pageSize
    const session = await getServerSession();

    if (!session?.user) {
        throw new Error('Not authenticated')
    }
    try {
        let condition = ""
        if (searchTerm) {
            condition = `AND (title LIKE '%${searchTerm}%' )`
        }


        const query = ` SELECT * FROM templates WHERE reseller = ${session?.user?.adminid} ${condition}`

        // Get total count
        const countResult: any = await db.query(
            `SELECT COUNT(*) AS temp_count FROM (${query}) AS subquery`
        )
        const totalCount = countResult[0]?.temp_count || 0

        // Get paginated data
        const rowsResult: any = await db.query(query + ` LIMIT ${offset}, ${pageSize}`)
        const rows = rowsResult || []


        if (rows) {
            for (let i = 0; i < rows.length; i++) {
                const bouquets = JSON.parse(rows[i].bouquets);
                const querydata = `SELECT  * FROM bouquets WHERE  id in (${bouquets});`;
                const bouquetsarray = await db.query(querydata);

                if (bouquetsarray) {
                    rows[i].bouquetsdata = bouquetsarray;
                } else {
                    rows[i].bouquetsdata = []
                }

            }

        }
        return {
            rows: rows,
            total: totalCount,
            page,
            pageSize
        }
    } catch (error) {
        console.error('Error in getTemplatesList:', error)
        throw error
    }
}

