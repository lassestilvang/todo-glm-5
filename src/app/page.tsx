/**
 * Root Page
 * 
 * Redirects to the today view
 */

import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/today');
}
