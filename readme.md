# ChatGr

ChatGr es una aplicación de mensajería en tiempo real desarrollada para uso interno entre Jack, Moi, Yaacov y el equipo. Está construida con tecnologías web simples y Firebase, enfocada en velocidad, simplicidad y una interfaz limpia tipo WhatsApp.

## Tecnologías utilizadas

- HTML, CSS y JavaScript
- Firebase Authentication
- Firebase Firestore (base de datos en tiempo real)
- Firebase Hosting (opcional)

## Funcionalidades actuales

- Registro e inicio de sesión con Firebase Auth
- Almacenamiento de usuarios en Firestore (`/users/{uid}`)
- Chats en tiempo real usando Firestore (`/chats/{chatId}/messages`)
- Sistema automático para generar IDs únicos de chat
- Lista dinámica de contactos
- Envío y visualización de mensajes sin recargar la página
- Interfaz tipo “messenger” con sidebar, área de chat y detalles de contacto

## Estructura del proyecto

- /public
- index.html
- styles.css
- app.js

- /firebase
- firebase-config.js
