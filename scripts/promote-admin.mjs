import pg from 'pg';

const url = process.env.DATABASE_URL;
const email = process.env.ADMIN_EMAIL?.toLowerCase();
if (!url || !email || !/^[^\s@]+@udistrital\.edu\.co$/.test(email)) {
  console.error('Define DATABASE_URL y ADMIN_EMAIL con un correo institucional válido.');
  process.exitCode = 1;
} else {
  const client = new pg.Client({ connectionString: url });
  try {
    await client.connect();
    const result = await client.query(
      `UPDATE users SET role = 'ADMINISTRADOR', updated_at = now()
       WHERE email = $1 AND active = TRUE RETURNING email, role`, [email]);
    if (result.rowCount !== 1) {
      console.error('No existe una cuenta activa con ese correo.');
      process.exitCode = 1;
    } else {
      console.log(`Rol ADMINISTRADOR asignado a ${result.rows[0].email}.`);
    }
  } catch (error) {
    console.error('No se pudo asignar el rol:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}
