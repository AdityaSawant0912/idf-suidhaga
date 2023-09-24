import NextAuth from 'next-auth'
import executeQuery from '@/lib/db'
import { compare } from 'bcryptjs'
import CredentialProvider from 'next-auth/providers/credentials'

export const authOptions = {
  // Configure one or more authentication providers
  session: {
    strategy: 'jwt'
  },
  providers: [
    CredentialProvider({
      name: 'credentials',
      credentials: {
        ph: {
          label: 'Mobile Number',
          type: 'number',
          placeholder: 'Enter your Mobile Number'
        },
        password: {
          label: 'Password',
          type: 'password'
        }
      },
      authorize: async credentials => {
        let dbUser = await executeQuery({
          query: `SELECT * FROM user_auth where user_ph=? LIMIT 1`,
          values: [credentials.ph]
        })
        if (dbUser.length < 0) return null // User not fount

        if (!(await compare(credentials.password, dbUser[0].user_hash)))
          return null // Passwords do not match

        /* To fetch user data and store it in user object so that you can access in user session object uncomment following code. */
        // By default user object contains only user_id, user_ph, user_hash.

        /* let userData = await executeQuery({
          query: `SELECT * FROM user_account where user_id=? LIMIT 1`,
          values: [dbUser[0].user_id]
        })
        if (userData.length < 0) return null; ;// User Data not found 
       
        let user = {
          ph: dbUser[0].ph,
          ...userData[0],
        } */

        return {
          userId: dbUser[0].user_id,
          ph: dbUser[0].user_ph,
          roleId: dbUser[0].user_role_id
        } // replace this with user object
      }
    })
  ],

  pages: {
    // signIn: '/auth/login',   // Uncomment this once you have login page
    error: '/auth/error' // Error code passed in query string as ?error=
  },

  callbacks: {
    async signIn({}) {
      return true
    },

    jwt: ({ token, user }) => {
      if (user) {
        token = {
          ...user
        }
      }
      return token
    },
    session: ({ token, session }) => {
      session.user = {
        ...token
      }
      return session
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  jwt: {
    encryption: true
  }
}

export default NextAuth(authOptions)
