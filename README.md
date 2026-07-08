# Sistema de Gestión de Eventos Corporativos

Este es un sistema backend desarrollado con **NestJS**, **TypeScript** y **TypeORM** utilizando **PostgreSQL** como base de datos. El proyecto incluye autenticación basada en JWT, gestión de roles, y un modelo de datos estructurado para controlar eventos, asistentes, proveedores, órdenes de servicio y pagos.

---

## Tecnologías y Características principales

*   **NestJS (v11)**: Framework progresivo de Node.js.
*   **TypeORM**: Mapeador objeto-relacional (ORM) para la interacción con la base de datos PostgreSQL.
*   **PostgreSQL**: Base de datos relacional para persistencia de datos.
*   **JWT & Passport**: Para la autenticación y protección de rutas mediante tokens JWT y control de roles.
*   **Docker & Docker Compose**: Configuración lista para levantar la base de datos de manera local y aislada.
*   **Bcrypt**: Para el hash seguro de contraseñas de usuarios.

---

## Estructura del Modelo de Datos (Módulos)

El sistema actualmente cuenta con los siguientes módulos:

1.  **Auth (Autenticación)**: Registro (`/auth/register`) y Login (`/auth/login`) con hashing de contraseñas y generación de JWT. Soporte para guardianes de roles (`RolesGuard`).
2.  **Event (Eventos)**: Administración de eventos (ubicación, fecha, presupuesto aprobado, aforo máximo).
3.  **Attendee (Asistentes)**: Registro de asistentes vinculados a eventos específicos, validando límites de aforo y correos duplicados por evento.
4.  **Provider (Proveedores)**: Clasificación de proveedores en categorías (Catering, Audiovisual, Decoración, Logística).
5.  **Service Order (Órdenes de Servicio)**: Registro de montos y estados (Pendiente, Aprobada) asociados a un proveedor y un evento.
6.  **Payment (Pagos)**: Registro de pagos parciales o finales para liquidar las órdenes de servicio.

---

## Requisitos Previos

Asegúrate de tener instalado en tu máquina:
*   [Node.js](https://nodejs.org/) (Versión recomendada: v18 o superior)
*   [npm](https://www.npmjs.com/)
*   [Docker](https://www.docker.com/) (Opcional, pero recomendado para levantar la base de datos)

---

## Inicialización y Configuración

Sigue estos pasos para poner en marcha el proyecto localmente:

### 1. Clonar el repositorio e instalar dependencias
```bash
# Instala las dependencias del proyecto
npm install
```

### 2. Configurar las Variables de Entorno
Crea un archivo `.env` en la raíz del proyecto (puedes tomar como referencia el archivo `.env` actual o crear uno nuevo) con las siguientes variables configuradas:

```env
// Secretos y credenciales de JWT
JWT_SECRET=tu_secreto_seguro_para_jwt

// Conexión con la Base de Datos
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=nest_user
DB_PASSWORD=nest_password
DB_NAME=corporate_events
```

### 3. Levantar la Base de Datos con Docker
El proyecto incluye un archivo `docker-compose.yml` preconfigurado con una base de datos PostgreSQL. Para iniciarla, ejecuta en tu terminal:

```bash
docker-compose up -d
```
> [!NOTE]
> Si deseas usar una base de datos PostgreSQL local instalada en tu sistema sin Docker, asegúrate de que esté ejecutándose en el puerto `5432` y que las credenciales del archivo `.env` coincidan con las de tu instalación local.

---

## Ejecución del Proyecto

### Desarrollo (Modo Watch)
Para ejecutar la aplicación localmente en modo desarrollo con recarga automática al guardar cambios:
```bash
npm run start:dev
```

---

## Pruebas (Tests)

El proyecto cuenta con suites de pruebas unitarias configuradas con Jest.

```bash
# Ejecutar todas las pruebas unitarias
npm run test

```
