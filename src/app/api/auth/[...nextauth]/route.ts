export const dynamic = 'force-dynamic';

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth'; // adjust this import to match your setup

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };