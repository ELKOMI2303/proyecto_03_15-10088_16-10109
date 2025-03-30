# Proyecto Lab 02

**Curso:** CI5321 (2025)  
**Puntuación Total:** 25 puntos  
**Alumnos:** Felix Arnos y Jonathan Bautista  
**Carnets:** 15-10088 y 16-10109  
**Fecha:** 2025-03-16

## Sistema Operativo

Este proyecto fue desarrollado en **Windows 11**.

## Dependencias

Este proyecto utiliza las siguientes dependencias:

- **Three.js**: Biblioteca de JavaScript para renderizado 3D.
- **Vite**: Herramienta de desarrollo rápida.

### Instalación de dependencias

Antes de ejecutar el proyecto, asegúrate de que tienes **Node.js** instalado en tu sistema. Si no lo tienes, puedes descargarlo desde [Node.js](https://nodejs.org/).

Luego, instala las dependencias ejecutando los siguientes comandos:

- **Three.js**:

  ```bash
  npm install --save three
  ```

- **Vite**:

  ```bash
  npm install --save-dev vite
  ```

### Instrucciones para ejecutar el proyecto

Instalar Node.js:
Asegúrate de tener Node.js instalado.

Inicializar el proyecto:

Ejecuta el siguiente comando en la terminal para inicializar un proyecto Node.js:

```bash
    npm init -y
```

### Instalar dependencias

Instala las dependencias ejecutando:

```bash
npm install --save three
```

```bash
npm install --save-dev vite
```

### Scripts personalizados

Se agregaron los siguientes scripts al archivo package.json para facilitar el desarrollo y la ejecución del proyecto:

```json
    "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
    }
```

- **npm run dev**: Ejecuta el servidor de desarrollo de Vite y abre el proyecto localmente.
- **npm run build**: Genera la versión optimizada para producción.
- **npm run preview**: Previsualiza la versión compilada del proyecto.

### Correr el proyecto en modo desarrollo

Para iniciar el servidor de desarrollo, ejecuta:

```bash
npm run dev
```

### Abrir el proyecto en el navegador

Abre tu navegador y visita la dirección local que aparece en la terminal (por defecto suele ser <http://localhost:5173>).

## Descripción de la Tarea

El objetivo de este proyecto es desarrollar un programa de manera **individual** o **en pareja** sobre Shaders y Materiales.

## Evaluación

1. **Para cada efecto (7 pts cada uno, total 21 pts):**

   - 1 pt Por parámetro (máximo 3 pts).
   - 2 pts Funcionamiento correcto.
   - 1 pt Complejidad.
   - 1 pt Uso adecuado de vertex y fragment shaders.

2. **Para el sistema completo (4 pts):**
   - 2 pts Optimización y eficiencia.
   - 2 pt Organización del código y uso de estructuras reutilizables.

## Consideraciones

- **Fecha tope de entrega:** Domingo 16 de Marzo de 2025, 11:59 pm.
- **Formato del repositorio GitHub:** `proyecto_02_CARNET.git`
- **Modalidad:** individual o en parejas.
- **Envío por correo electrónico a:**
  - <10-87970@usb.ve>
  - Con copia a: <depci-invitado2@usb.ve>
- **Asunto del correo:** `[ci5321] Proyecto Lab 02`
- **Contenido del correo:**
  - Saludo con los **nombres** y **carnets** del equipo.
  - Enlace al **repositorio GitHub**.
  - Enlace a un **video en YouTube** mostrando el funcionamiento del proyecto. Es importante hablar o agregar subtítulos explicando el proyecto como si fuera una presentación.

## Estructura del Repositorio

- El repositorio debe incluir un README que contenga:
  - **Nombres, Carnets y API utilizada.**
  - **Sistema operativo** en el que se desarrolló el proyecto.
  - **Lista de dependencias** e instrucciones para ejecutar el programa.
