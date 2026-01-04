import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import prisma from "./prisma";

export const {handlers, signIn, signOut, auth} = NextAuth({
    providers : [
        GoogleProvider({
            clientId : process.env.GOOGLE_CLIENT_ID!,
            clientSecret : process.env.GOOGLE_CLIENT_SECRET!,
        }),
        GithubProvider({
            clientId : process.env.GITHUB_CLIENT_ID!,
            clientSecret : process.env.GITHUB_CLIENT_SECRET!,
        })
    ],
    callbacks : {
        async signIn({user, account}) {
            if (!user.email) {
                console.error("No email provided by OAuth provider");
                return false;
            }

            if(account?.provider === "google" || account?.provider === "github") {
                try {
                    const existingUser = await prisma.user.findUnique({
                        where : {
                            email : user.email
                        },
                        include : {
                            accounts : true
                        }
                    });

                    if (!existingUser) {
                        await prisma.user.create({
                            data : {
                                email : user.email,
                                name : user.name || null,
                                image : user.image || null,
                                accounts : {
                                    create : {
                                        type : account.type,
                                        provider : account.provider,
                                        providerAccountId : account.providerAccountId,
                                        access_token : account.access_token,
                                        refresh_token : account.refresh_token,
                                        expires_at : account.expires_at,
                                        token_type : account.token_type,
                                        scope : account.scope,
                                        id_token : account.id_token,
                                        session_state : account.session_state as string | null
                                    }
                                }
                            }
                        });
                        console.log("New user created:", user.email);
                    } else {
                        await prisma.user.update({
                            where : {
                                email : user.email
                            },
                            data : {
                                name : user.name || existingUser.name,
                                image : user.image || existingUser.image
                            }
                        });

                        const accountExists = existingUser.accounts.some(
                            acc => acc.provider === account.provider && acc.providerAccountId === account.providerAccountId
                        );
                        
                        if (!accountExists) {
                            await prisma.account.create({
                                data : {
                                    userId : existingUser.id,
                                    type : account.type,
                                    provider : account.provider,
                                    providerAccountId : account.providerAccountId,
                                    access_token : account.access_token,
                                    refresh_token : account.refresh_token,
                                    expires_at : account.expires_at,
                                    token_type : account.token_type,
                                    scope : account.scope,
                                    id_token : account.id_token,
                                    session_state : account.session_state as string | null
                                }
                            });
                        }
                        
                        console.log("Existing user updated:", user.email);
                    }
                    return true;
                    
                } catch (error) {
                    console.error("Error during sign in:", error);
                    return false;
                }
            }
            return true;
        }, 
        async jwt({ token, user, account }) {
      // When user first signs in, fetch their data from database
      if (account && user) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        });
        
        if (dbUser) {
          token.id = dbUser.id;
          token.email = dbUser.email;
          token.name = dbUser.name;
          token.image = dbUser.image;
        }
      }
      return token;
    },
    
    async session({ session, token }) {
      // Add user data from token to session
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.image as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/signin", 
    error : "/error"
  },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  session: {
    strategy: "jwt", 
    maxAge: 30 * 24 * 60 * 60, 
  },
});