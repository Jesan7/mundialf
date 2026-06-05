# MundialF 2026 ⚽🏆

App de pronósticos del Mundial 2026. Stack: React + Vite + TailwindCSS + Firebase.

---

## 🚀 Setup rápido

### 1. Clonar / copiar el proyecto

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar Firebase
1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com)
2. Habilita **Authentication** → Email/Password
3. Habilita **Firestore** → Modo producción o prueba
4. Habilita **Storage**
5. Copia tus credenciales

### 4. Variables de entorno
```bash
cp .env.example .env
# Edita .env con tus claves de Firebase
```

### 5. Ejecutar localmente
```bash
npm run dev
```

### 6. Seed de partidos (opcional)
Para poblar Firestore con partidos reales, configura Firebase Admin SDK y ejecuta:
```bash
node scripts/seedMatches.mjs
```

---

## 🌐 Deploy en Vercel

```bash
# Instala Vercel CLI
npm i -g vercel

# Deploy
vercel

# Agrega variables de entorno en Vercel Dashboard:
# VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, etc.
```

El archivo `vercel.json` ya está configurado para SPA routing.

---

## 📦 Fases

| Fase | Estado | Contenido |
|------|--------|-----------|
| 1    | ✅ Completa | Auth, routing, layout, sesión persistente |
| 2    | 🔜 Próxima | Home, partidos, pronósticos, ranking |
| 3    | 🔜         | Grupos, chat, reacciones, memes |
| 4    | 🔜         | Monedas, notificaciones, seed, deploy |

---

## 🗄️ Estructura Firestore

```
users/{uid}
matches/{matchId}
predictions/{uid_matchId}
groups/{groupId}
groupMessages/{groupId}/messages/{msgId}
notifications/{uid}/items/{notifId}
```

---

## 🎨 Colores del sistema

| Token | Valor | Uso |
|-------|-------|-----|
| `brand-dark` | `#0a0e1a` | Fondo principal |
| `brand-card` | `#111827` | Tarjetas |
| `brand-neon` | `#00ff7f` | Acento principal |
| `brand-gold` | `#fbbf24` | Monedas, puntos |
| `brand-blue` | `#3b82f6` | Info, links |

---

## 📱 Sistema de puntos

| Condición | Puntos |
|-----------|--------|
| Ganador correcto | 1 |
| Diferencia correcta | 2 |
| Marcador exacto | 5 |

> Los puntos NO son acumulables (exacto = 5 únicamente)
