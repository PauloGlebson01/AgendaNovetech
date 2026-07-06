// ==================== CONFIGURAÇÃO DO FIREBASE ====================
const firebaseConfig = {
    apiKey: "AIzaSyAhniSdv1Agn6A4MvBlMu3bOVc9eZwgf5M",
    authDomain: "agenda-empresarial-adf7f.firebaseapp.com",
    projectId: "agenda-empresarial-adf7f",
    storageBucket: "agenda-empresarial-adf7f.firebasestorage.app",
    messagingSenderId: "523620812071",
    appId: "1:523620812071:web:f04e51d512767d1ccad502",
    measurementId: "G-DLW4GSYT48"
};

// ==================== INICIALIZAR FIREBASE ====================
// Verificar se o Firebase já foi inicializado
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log("✅ Firebase inicializado com sucesso!");
} else if (typeof firebase !== 'undefined') {
    console.log("ℹ️ Firebase já estava inicializado");
} else {
    console.error("❌ Firebase SDK não carregado!");
}

// ==================== INICIALIZAR SERVIÇOS ====================
let auth = null;
let db = null;

if (typeof firebase !== 'undefined') {
    try {
        auth = firebase.auth();
        db = firebase.firestore();
        
        // Configurar Firestore
        db.settings({
            timestampsInSnapshots: true
        });
        
        // Configurar persistência
        auth.setPersistence(firebase.auth.Auth.Persistence.SESSION)
            .catch(error => console.log("Erro persistência:", error));
            
        console.log("✅ Firestore inicializado com sucesso!");
        console.log("✅ Auth inicializado com sucesso!");
    } catch (error) {
        console.error("❌ Erro ao inicializar Firestore:", error);
    }
} else {
    console.error("❌ Firebase não está disponível para inicializar os serviços");
}

// ==================== EXPORTAR PARA USO GLOBAL ====================
// Tornar auth e db disponíveis globalmente
window.auth = auth;
window.db = db;

// Também disponibilizar via variáveis globais (para compatibilidade)
window.firebase = firebase;

console.log("📦 Firebase Config carregado:", {
    firebase: typeof firebase !== 'undefined' ? '✅' : '❌',
    auth: auth ? '✅' : '❌',
    db: db ? '✅' : '❌'
});