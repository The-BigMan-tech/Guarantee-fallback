import postgres from 'postgres'
const sql = postgres({
    host: 'localhost',      // PostgreSQL server address
    port: 5432,             // PostgreSQL server port
    username: 'postgres', // Your PostgreSQL username
    password: 'JehovahmyGod1234$$#', // Your PostgreSQL password
    database: 'school', // The name of your database
})
async function fetchData() {
    const rows = await sql`SELECT * FROM students LIMIT 100`;
    console.log(rows);
}
fetchData()