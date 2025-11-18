// lib/auth-service.ts
import { hashPassword } from '../utils/auth'
import { db } from '../db';

// Your main login function converted to Next.js
export async function loginUser(credentials: {
    email: string
    password: string
    domain?: string
    ipAddress?: string
}) {
    const { email, password, domain = '', ipAddress = '' } = credentials
    const username = email

    try {
        // 1. Check login tries (rate limiting)
        // Skip IP blocking check in development for localhost
        const isDevelopment = process.env.NODE_ENV === 'development'
        const isLocalhost = ipAddress === '127.0.0.1' || ipAddress === '::1' || ipAddress === 'localhost'

        if (!(isDevelopment && isLocalhost)) {
            const loginTriesError = await checkLoginTries(ipAddress)
            if (loginTriesError) {
                throw new Error(loginTriesError)
            }
        }

        // 2. Validate required fields
        if (!username || !password) {
            await loginTries(username, ipAddress)
            throw new Error('Username and password are required')
        }

        // 3. Validate input length
        if (username.length > 30 || password.length > 30) {
            await loginTries(username, ipAddress)
            throw new Error('Input data too long')
        }

        // 4. Sanitize username
        const sanitizedUsername = username.replace(/[^a-zA-Z0-9-]/gi, '')

        // Debug logging (remove in production)
        console.log('🔍 Login attempt:', {
            originalUsername: username,
            sanitizedUsername: sanitizedUsername,
            usernameChanged: username !== sanitizedUsername
        })

        // 5. Check for same username/password
        if (username === password && username !== 'admin') {
            await loginTries(sanitizedUsername, ipAddress)
            throw new Error('Login error. Please check admin name/password.')
        }

        // 6. Query to fetch user data
        const query = `
      SELECT 
        maa_admin.*, 
        member_groups.group_id AS member_group_id, 
        member_groups.group_name, 
        member_groups.allow_download, 
        member_groups.reseller_trial_credit_allow,  
        member_groups.allow_export,
        member_groups.create_sub_resellers, 
        member_groups.create_sub_resellers_price, 
        member_groups.group_color, 
        member_groups.is_reseller, 
        member_groups.is_banned,  
        member_groups.is_admin,
        COALESCE((SELECT GROUP_CONCAT(sub.adminid) FROM maa_admin sub WHERE sub.father = maa_admin.adminid OR sub.adminid = maa_admin.adminid), '') AS resellers
      FROM maa_admin 
      LEFT JOIN member_groups 
        ON maa_admin.member_group_id = member_groups.group_id  
      WHERE maa_admin.adm_username = ? 
        AND maa_admin.suspend = 0
    `

        const rows: any = await db.query(query, [sanitizedUsername])

        // Debug logging
        console.log('👤 User lookup result:', {
            username: sanitizedUsername,
            found: rows && rows.length > 0,
            userCount: rows?.length || 0
        })

        if (rows && rows.length > 0) {
            const user = rows[0]

            // 7. Check for suspended accounts
            if (user.suspend === 1 || user.suspend === 2) {
                await logAction('login', 'suspended', 'Tried to login to suspended account', sanitizedUsername)
                throw new Error('Sorry: your account has been suspended.')
            }

            // 8. Check for reset codes level (level 4)
            if (user.level === 4) {
                await logAction('login', 'reset_codes', '', sanitizedUsername)
                return {
                    success: false,
                    resetRequired: true,
                    adminid: user.adminid,
                    admin_name: user.adm_username,
                }
            }

            // 9. Verify password
            const hashedPassword = hashPassword(password)

            // Debug logging (remove in production)
            console.log('🔐 Password verification:', {
                username: sanitizedUsername,
                hashedInputLength: hashedPassword.length,
                storedPasswordLength: user.adm_password?.length || 0,
                passwordsMatch: hashedPassword === user.adm_password,
                hashedInput: hashedPassword,
                storedPassword: user.adm_password,
                salt1: process.env.SALT1 || 'NOT SET',
                salt2: process.env.SALT2 || 'NOT SET'
            })

            if (hashedPassword !== user.adm_password) {
                await loginTries(sanitizedUsername, ipAddress)
                await logAction('login', 'login_fail', 'Failed login attempt', sanitizedUsername)
                throw new Error('Login error. Please check admin name/password.')
            }

            // 10. SUCCESSFUL LOGIN
            const currentTime = Math.floor(Date.now() / 1000)

            // Update last login
            await db.query(
                "UPDATE maa_admin SET lastlogin = ?, ipaddress = ?, user_agent = ? WHERE adminid = ?",
                [currentTime, ipAddress, 'Next.js Server', user.adminid]
            )

            // Log successful login
            await logAction('login', 'login_success', 'Next.js Login', sanitizedUsername)

            // Clean up login tries
            await clearLoginTries(ipAddress)

            // Prepare user payload
            const balance = await getBalance(user.adminid)
            const userFormatted = formatUserData(user)

            const payload = {
                ...userFormatted,
                balance
            }

            // Create session data
            const sessionData = {
                adminid: user.adminid,
                admin_name: user.adm_username,
                level: user.level,
                ip: ipAddress,
                lastlogin: currentTime
            }

            return {
                success: true,
                user: payload,
                session: sessionData,
            }

        } else {
            // User not found
            await loginTries(sanitizedUsername, ipAddress)
            await logAction('login', 'login_fail', 'User not found', sanitizedUsername)
            throw new Error('Login error. Please check admin name/password.')
        }

    } catch (err) {
        console.error("Admin Login Error: ", err)
        throw err
    }
}

// Get user account data
export async function getUserAccount(adminid: number) {
    try {
        const query = `
      SELECT 
        maa_admin.*, 
        member_groups.group_id AS member_group_id, 
        member_groups.group_name, 
        member_groups.allow_download, 
        member_groups.reseller_trial_credit_allow,  
        member_groups.allow_export,
        member_groups.create_sub_resellers, 
        member_groups.create_sub_resellers_price, 
        member_groups.group_color, 
        member_groups.is_reseller, 
        member_groups.is_banned,  
        member_groups.is_admin,
        COALESCE((SELECT GROUP_CONCAT(sub.adminid) FROM maa_admin sub WHERE sub.father = maa_admin.adminid OR sub.adminid = maa_admin.adminid), '') AS resellers
      FROM maa_admin 
      LEFT JOIN member_groups 
        ON maa_admin.member_group_id = member_groups.group_id  
      WHERE maa_admin.adminid = ?
    `

        const rows: any = await db.query(query, [adminid])

        if (rows.length === 0) {
            throw new Error('User not found')
        }

        const userData = rows[0]
        const balance = await getBalance(userData.adminid)

        // Format user data
        const formattedUser = formatUserData(userData)
        formattedUser.balance = balance

        // Session data
        const sessionData = {
            adminid: formattedUser.adminid,
            admin_name: formattedUser.adm_username,
            level: formattedUser.level,
            ip: '', // Will be set from request
            lastlogin: formattedUser.lastlogin
        }
        console.log("sessionData:", sessionData)
        console.log("formattedUser:", formattedUser)
        console.log("balance:", balance)
        
        return {
            success: true,
            user: formattedUser,
            session: sessionData,
        }

    } catch (err) {
        console.error("My Account Error: ", err)
        throw err
    }
}

// Helper functions (same as your original)
function formatUserData(userData: any) {
    const formattedUser = { ...userData }

    // Handle logo conversion if exists
    if (formattedUser.logo && formattedUser.logo.length > 0) {
        const base64Image = Buffer.from(formattedUser.logo).toString("base64")
        formattedUser.logo = `data:image/png;base64,${base64Image}`
    }

    // Remove sensitive data
    delete formattedUser.adm_password
    delete formattedUser.password
    delete formattedUser.allowed_ips

    return formattedUser
}

async function checkLoginTries(ip: string): Promise<string | null> {
    const rows: any = await db.query(
        'SELECT timeDiff FROM maa_login_ips WHERE ip = ? AND tries >= 3',
        [ip]
    )

    if (rows.length > 0) {
        const row = rows[0]
        if (Math.floor(Date.now() / 1000) < row.timeDiff) {
            return `Your IP (${ip}) is blocked for 30 minutes. Please contact system admin to unblock your IP.`
        }
    }
    return null
}

async function loginTries(username: string, ip: string) {
    const timeDiff = Math.floor(Date.now() / 1000) + 1800 // 30 minutes

    await db.query(
        `INSERT INTO maa_login_ips (username, ip, timeDiff, tries) 
     VALUES (?, ?, ?, 1) 
     ON DUPLICATE KEY UPDATE timeDiff = ?, tries = tries + 1`,
        [username, ip, timeDiff, timeDiff]
    )
}

async function clearLoginTries(ip: string) {
    await db.query('DELETE FROM maa_login_ips WHERE ip = ?', [ip])
}

async function getBalance(adminid: number): Promise<number> {
    // Implement your balance logic here
    const rows: any = await db.query(
        "SELECT SUM(credit - depit) AS bal FROM maa_trans WHERE admin = ?",
        [adminid]
    )
    return rows.length > 0 ? parseFloat(rows[0].balance) : 0
}

async function logAction(app: string, action: string, logData: string, admin: string = '', ip: string = '') {
    const dataLog = typeof logData === 'object' ?
        Object.entries(logData).map(([key, val]) => `${key} = ${val}`).join('\n') :
        logData

    await db.query(
        `INSERT INTO maa_logs_sys (dtime, admin_user, app, ip, action, the_log) 
     VALUES (NOW(), ?, ?, ?, ?, ?)`,
        [admin, app, ip, action, dataLog]
    )
}