import Link from "next/link";
export default function Home() {
  // throw new Error('A sample error')
  return (
      <>
          <h1>Hello world</h1>
          <Link href='/random'>Link to random</Link>
      </>
  );
}
