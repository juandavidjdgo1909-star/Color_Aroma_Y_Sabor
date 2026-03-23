import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error('❌  Error: MONGO_URI no está definida en el archivo .env');
    process.exit(1);
}

const userSchema = new mongoose.Schema({
    nombre:   { type: String, required: true, unique: true },
    email:    { type: String, required: true, unique: true },
    password: { type: String, required: true },
    rol:      { type: String, enum: ['Mesero', 'Chef', 'Admin'], required: true },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

const DEFAULT_USERS = [
    {
        nombre:   'Administrador',
        email:    'admin@gourmetexpress.com',
        password: 'admin123',
        rol:      'Admin',
    },
    {
        nombre:   'Chef Principal',
        email:    'chef@gourmetexpress.com',
        password: 'chef123',
        rol:      'Chef',
    },
    {
        nombre:   'Mesero Uno',
        email:    'mesero@gourmetexpress.com',
        password: 'mesero123',
        rol:      'Mesero',
    },
];

const seed = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅  Conectado a MongoDB\n');

        let creados = 0;
        let omitidos = 0;

        for (const userData of DEFAULT_USERS) {
            const existe = await User.findOne({ email: userData.email });

            if (existe) {
                console.log(`⏭️   Omitido (ya existe): ${userData.email}`);
                omitidos++;
                continue;
            }

            const hashedPassword = await bcrypt.hash(userData.password, 10);
            await User.create({ ...userData, password: hashedPassword });
            console.log(`👤  Creado [${userData.rol}]: ${userData.nombre} — ${userData.email}`);
            creados++;
        }

        console.log('\n─────────────────────────────────────────');
        console.log(`  Usuarios creados : ${creados}`);
        console.log(`  Ya existían      : ${omitidos}`);
        console.log('─────────────────────────────────────────');

        if (creados > 0) {
            console.log('\n🔑  Credenciales para ingresar:\n');
            for (const u of DEFAULT_USERS) {
                console.log(`  ${u.rol.padEnd(7)}  →  ${u.email}  /  ${u.password}`);
            }
        }

        console.log('\n✅  Seed completado.\n');
    } catch (error) {
        console.error('❌  Error al ejecutar el seed:', error.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
};

seed();
