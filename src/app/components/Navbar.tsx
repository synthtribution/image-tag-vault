'use client';
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="navbar">
      <Link href="/">Home</Link>
      <Link href="/tags">Tags</Link>
      <Link href="/characters">Characters</Link>
      <Link href="/ratings">Ratings</Link>
    </nav>
  );
}
