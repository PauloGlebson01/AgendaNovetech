// ==================== CONTROLE DE ABAS (TABS) ====================
document.addEventListener('DOMContentLoaded', function() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            this.classList.add('active');
            
            const targetTab = document.getElementById(tabId + 'Tab');
            if (targetTab) {
                targetTab.classList.add('active');
            }
        });
    });
    
    console.log("✅ Sistema de abas inicializado");
});

// ==================== OBSERVADOR DE MUTAÇÃO PARA MENUS ====================
function iniciarObservadorMenu() {
    const observer = new MutationObserver(function(mutations) {
        const menuReservas = document.getElementById('menuReservas');
        if (menuReservas && currentUser) {
            forcarAtualizacaoMenu(currentUser);
            observer.disconnect();
            console.log("✅ Observador de menu finalizado");
        }
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    setTimeout(() => {
        observer.disconnect();
        console.log("⏰ Observador de menu finalizado por timeout");
    }, 5000);
}

// ==================== VARIÁVEIS GLOBAIS ====================
let currentUser = null;
let colaboradoresCache = [];
let eventoParaExcluir = null;
let eventoEmEdicao = null;
let colaboradorEmEdicao = null;
let unsubscribeEventos = null;
let unsubscribeColaboradores = null;
let unsubscribeDashboard = null;
let unsubscribeFerias = null;
let unsubscribeBloqueios = null;
let filtroStatusAtual = '';
let filtroDataAtual = '';
let filtroPeriodo = 'todos';
let feriasCache = [];

// ==================== VARIÁVEIS RESERVAS ====================
let reservasCache = [];
let unsubscribeReservas = null;
let reservaEmEdicao = null;
let filtroReservaDataAtual = '';
let filtroReservaSalaAtual = '';
let filtroReservaStatusAtual = '';

// ==================== CONSTANTES DE LIMITE DE DEMANDA (PADRÃO) ====================
let LIMITE_MAXIMO_EVENTOS_DIA = 5;
let LIMITE_MAXIMO_EVENTOS_SEMANA = 15;
let LIMITE_MAXIMO_EVENTOS_MES = 30;
let CARGA_HORARIA_MAXIMA = 8;
let DEMANDA_ATIVA = true;

// ==================== CONSTANTES DE HORÁRIOS ====================
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DIAS_SEMANA_COMPLETO = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const HORARIOS_PADRAO = {
    ativo: true,
    diasDisponiveis: [1, 2, 3, 4, 5],
    horarioInicio: '08:00',
    horarioFim: '18:00',
    intervaloSlots: 60,
    duracaoSlot: 60,
    emailSuporte: 'suporte@novetech.com.br'
};

// ==================== CONSTANTES DE TIPOS ====================
const TIPO_LABELS = {
    'reuniao': '📋 Reunião',
    'reuniao_gestor': '👔 Reunião com Gestor',
    'treinamento': '🎓 Treinamento',
    'treinamento_interno': '🏢 Treinamento Interno',
    'suporte': '🛠️ Suporte Técnico',
    'demonstracao': '📊 Demonstração',
    'outro': '📌 Outro'
};

const TIPO_COLORS = {
    'reuniao': '#dbeafe',
    'reuniao_gestor': '#ede9fe',
    'treinamento': '#d1fae5',
    'treinamento_interno': '#fef3c7',
    'suporte': '#fef3c7',
    'demonstracao': '#e0e7ff',
    'outro': '#f1f5f9'
};

const TIPO_BORDER_COLORS = {
    'reuniao': '#2563eb',
    'reuniao_gestor': '#7c3aed',
    'treinamento': '#059669',
    'treinamento_interno': '#d97706',
    'suporte': '#d97706',
    'demonstracao': '#4338ca',
    'outro': '#475569'
};

const TIPOS_INTERNOS = ['reuniao', 'treinamento_interno'];

// ==================== CONSTANTES DE STATUS ====================
const STATUS_LABELS = {
    'designado': '📋 Designado',
    'em_andamento': '🔄 Em Andamento',
    'realizado': '✅ Realizado',
    'cancelado': '❌ Cancelado'
};

const STATUS_COLORS = {
    'designado': '#dbeafe',
    'em_andamento': '#fef3c7',
    'realizado': '#d1fae5',
    'cancelado': '#fee2e2'
};

const STATUS_TEXT_COLORS = {
    'designado': '#1d4ed8',
    'em_andamento': '#d97706',
    'realizado': '#059669',
    'cancelado': '#dc2626'
};

const STATUS_ICONS = {
    'designado': 'fa-clipboard-list',
    'em_andamento': 'fa-spinner',
    'realizado': 'fa-check-circle',
    'cancelado': 'fa-times-circle'
};

// ==================== CONSTANTES RESERVAS ====================
const SALAS_LABELS = {
    'sala_01': '📋 Sala 01',
    'sala_02': '📋 Sala 02',
};

const SALAS_CAPACIDADE = {
    'sala_01': 8,
    'sala_02': 12,
};

const RESERVA_STATUS_LABELS = {
    'pendente': '🟡 Pendente',
    'confirmada': '🟢 Confirmada',
    'em_andamento': '🔄 Em Andamento',
    'concluida': '✅ Concluída',
    'cancelada': '❌ Cancelada'
};

const RESERVA_STATUS_COLORS = {
    'pendente': '#fef3c7',
    'confirmada': '#d1fae5',
    'em_andamento': '#dbeafe',
    'concluida': '#d1fae5',
    'cancelada': '#fee2e2'
};

const RESERVA_STATUS_TEXT_COLORS = {
    'pendente': '#d97706',
    'confirmada': '#059669',
    'em_andamento': '#1d4ed8',
    'concluida': '#059669',
    'cancelada': '#dc2626'
};

// ==================== FUNÇÃO AUXILIAR PARA ADICIONAR MINUTOS ====================
function addMinutes(time, minutes) {
    if (!time) return time;
    const [h, m] = time.split(':').map(Number);
    const total = h * 60 + m + minutes;
    const newH = Math.floor(total / 60);
    const newM = total % 60;
    return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

// ==================== FUNÇÃO PARA EXTRAIR DATA ====================
function extrairDataISO(dataISO) {
    if (!dataISO) return null;
    return dataISO.split('T')[0];
}

// ==================== FUNÇÃO AUXILIAR PARA CONVERTER HORÁRIO EM MINUTOS ====================
function horarioParaMinutos(horario) {
    if (!horario) return 0;
    const [h, m] = horario.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
}

// ==================== FUNÇÃO AUXILIAR PARA CONVERTER MINUTOS EM HORÁRIO ====================
function minutosParaHorario(minutos) {
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// ==================== FUNÇÃO PARA DEFINIR SEÇÃO INICIAL ====================
function definirSecaoInicial(userData) {
    if (!userData) return;
    
    const isAdmin = userData.tipo === 'admin';
    
    document.querySelectorAll('.section').forEach(sec => {
        sec.classList.remove('active');
        sec.style.display = 'none';
    });
    
    document.querySelectorAll('.sidebar li').forEach(li => {
        li.classList.remove('active');
    });
    
    if (isAdmin) {
        const dashboard = document.getElementById('dashboardSection');
        if (dashboard) {
            dashboard.classList.add('active');
            dashboard.style.display = 'block';
        }
        
        const menuDashboard = document.getElementById('menuDashboard');
        if (menuDashboard) {
            menuDashboard.classList.add('active');
        }
        
        console.log("✅ Dashboard definido como seção inicial para ADMIN");
    } else {
        const reservas = document.getElementById('reservasSection');
        if (reservas) {
            reservas.classList.add('active');
            reservas.style.display = 'block';
        }
        
        const menuReservas = document.getElementById('menuReservas');
        if (menuReservas) {
            menuReservas.classList.add('active');
        }
        
        console.log("✅ Reservas definido como seção inicial para COLABORADOR");
    }
}

// ==================== FUNÇÃO PARA FORÇAR ATUALIZAÇÃO DO MENU ====================
function forcarAtualizacaoMenu(userData) {
    if (!userData) {
        console.warn("⚠️ userData não fornecido para forcarAtualizacaoMenu");
        return;
    }
    
    const tipo = userData.tipo || 'colaborador';
    const isAdmin = tipo === 'admin';
    
    console.log(`🔧 Forçando atualização do menu para: ${tipo} (Admin: ${isAdmin})`);
    
    const menuDashboard = document.getElementById('menuDashboard');
    const menuSolicitacoes = document.getElementById('menuSolicitacoes');
    const menuReservas = document.getElementById('menuReservas');
    const menuAgenda = document.getElementById('menuAgenda');
    const menuColaboradores = document.getElementById('menuColaboradores');
    const menuVerAgenda = document.getElementById('menuVerAgenda');
    const menuConfig = document.getElementById('menuConfig');
    const solicBadge = document.getElementById('solicitacoesBadge');
    
    // Função auxiliar para esconder um menu
    function hideMenu(el) {
        if (!el) return;
        el.style.display = 'none';
        el.style.visibility = 'hidden';
        el.style.opacity = '0';
        el.style.pointerEvents = 'none';
        el.style.height = '0';
        el.style.padding = '0';
        el.style.margin = '0';
        el.style.overflow = 'hidden';
        el.style.border = 'none';
        el.classList.add('menu-hidden');
    }
    
    // Função auxiliar para mostrar um menu
    function showMenu(el) {
        if (!el) return;
        el.style.display = 'block';
        el.style.visibility = 'visible';
        el.style.opacity = '1';
        el.style.pointerEvents = 'auto';
        el.style.height = 'auto';
        el.style.padding = '';
        el.style.margin = '';
        el.style.overflow = '';
        el.style.border = '';
        el.classList.remove('menu-hidden');
        el.removeAttribute('style');
    }
    
    if (isAdmin) {
        showMenu(menuDashboard);
        showMenu(menuSolicitacoes);
        showMenu(menuColaboradores);
        showMenu(menuConfig);
        
        if (solicBadge) {
            solicBadge.style.display = 'inline-block';
        }
        
        console.log("✅ Menu ADMIN carregado com sucesso!");
        
    } else {
        hideMenu(menuDashboard);
        hideMenu(menuSolicitacoes);
        hideMenu(menuColaboradores);
        hideMenu(menuConfig);
        
        if (solicBadge) {
            solicBadge.style.display = 'none';
        }
        
        console.log("✅ Menu COLABORADOR carregado com sucesso!");
    }
    
    showMenu(menuReservas);
    showMenu(menuAgenda);
    showMenu(menuVerAgenda);
    
    console.log("✅ Atualização do menu concluída!");
}

// ==================== FUNÇÃO PARA REINICIAR SIDEBAR ====================
function reiniciarSidebar() {
    setTimeout(() => {
        iniciarSidebar();
        console.log("🔄 Sidebar reiniciada");
    }, 100);
}

// ==================== VERIFICAÇÃO DE AUTENTICAÇÃO ====================
auth.onAuthStateChanged(async (user) => {
    console.log("Auth state changed:", user ? user.email : "null");
    
    if (user) {
        if (typeof verificarStatusUsuario === 'function') {
            const statusResult = await verificarStatusUsuario(user);
            
            if (!statusResult || statusResult.status === 'nao_encontrado') {
                return;
            }
            
            if (statusResult.status === 'solicitante' || statusResult.status === 'rejeitado') {
                return;
            }
        }
        
        try {
            const userDoc = await db.collection('usuarios').doc(user.uid).get();
            
            if (!userDoc.exists) {
                console.error("Usuário não encontrado no Firestore");
                await auth.signOut();
                alert("Usuário não cadastrado no sistema. Contate o administrador.");
                return;
            }
            
            const userData = userDoc.data();
            currentUser = { uid: user.uid, ...userData };
            
            const isAdmin = userData.tipo === 'admin';
            const isColaborador = userData.tipo === 'colaborador';
            
            if (!isAdmin && !isColaborador) {
                await auth.signOut();
                alert("Acesso permitido apenas para administradores e colaboradores.");
                return;
            }
            
            sessionStorage.setItem('userTipo', userData.tipo);
            sessionStorage.setItem('userNome', userData.nome);
            
            const path = window.location.pathname;
            if (path.includes('index.html') || path === '/' || path.endsWith('/')) {
                window.location.href = 'admin.html';
            } else if (path.includes('admin.html')) {
                await carregarAdmin();
                
                forcarAtualizacaoMenu(currentUser);
                
                setTimeout(() => { forcarAtualizacaoMenu(currentUser); }, 100);
                setTimeout(() => { forcarAtualizacaoMenu(currentUser); }, 300);
                setTimeout(() => { forcarAtualizacaoMenu(currentUser); }, 500);
                setTimeout(() => { forcarAtualizacaoMenu(currentUser); }, 1000);
                
                if (isAdmin) {
                    if (typeof carregarSolicitacoesPendentes === 'function') {
                        await carregarSolicitacoesPendentes();
                    }
                    if (typeof iniciarListenerSolicitacoes === 'function') {
                        iniciarListenerSolicitacoes();
                    }
                }
            }
        } catch (error) {
            console.error("Erro ao buscar usuário:", error);
            alert("Erro ao carregar dados do usuário: " + error.message);
        }
    } else if (!window.location.pathname.includes('index.html') && 
               !window.location.pathname.includes('agenda-publica.html')) {
        window.location.href = 'index.html';
    }
});

// ==================== LOGIN ====================
async function fazerLogin() {
    const email = document.getElementById('loginEmail').value;
    const senha = document.getElementById('loginSenha').value;
    
    if (!email || !senha) {
        alert('Preencha e-mail e senha');
        return;
    }
    
    try {
        console.log("Tentando login com:", email);
        const credencial = await auth.signInWithEmailAndPassword(email, senha);
        console.log("Login bem sucedido:", credencial.user.uid);
        
        const userDoc = await db.collection('usuarios').doc(credencial.user.uid).get();
        
        if (!userDoc.exists) {
            await auth.signOut();
            alert('Usuário não cadastrado no sistema');
            return;
        }
        
        const userData = userDoc.data();
        
        if (userData.aprovado !== true || userData.tipo === 'solicitante' || userData.tipo === 'rejeitado') {
            await auth.signOut();
            if (userData.tipo === 'rejeitado') {
                alert(`❌ Seu cadastro foi rejeitado.\nMotivo: ${userData.motivoRejeicao || 'Não informado'}\n\nEntre em contato com o administrador.`);
            } else {
                alert('⏳ Seu cadastro está aguardando aprovação.\n\nVocê receberá um e-mail quando for aprovado.');
            }
            return;
        }
        
        if (userData.tipo !== 'admin' && userData.tipo !== 'colaborador') {
            await auth.signOut();
            alert('Acesso permitido apenas para administradores e colaboradores.');
            return;
        }
        
        window.location.href = 'admin.html';
        
    } catch (error) {
        console.error("Erro detalhado do login:", error);
        
        switch(error.code) {
            case 'auth/user-not-found':
                alert('Usuário não encontrado. Verifique seu e-mail.');
                break;
            case 'auth/wrong-password':
                alert('Senha incorreta. Tente novamente.');
                break;
            case 'auth/invalid-email':
                alert('E-mail inválido.');
                break;
            case 'auth/too-many-requests':
                alert('Muitas tentativas. Aguarde um momento.');
                break;
            default:
                alert('Erro no login: ' + error.message);
        }
    }
}

async function logout() {
    try {
        if (unsubscribeEventos) {
            unsubscribeEventos();
            unsubscribeEventos = null;
        }
        if (unsubscribeColaboradores) {
            unsubscribeColaboradores();
            unsubscribeColaboradores = null;
        }
        if (unsubscribeDashboard) {
            unsubscribeDashboard();
            unsubscribeDashboard = null;
        }
        if (unsubscribeFerias) {
            unsubscribeFerias();
            unsubscribeFerias = null;
        }
        if (unsubscribeReservas) {
            unsubscribeReservas();
            unsubscribeReservas = null;
        }
        if (unsubscribeBloqueios) {
            unsubscribeBloqueios();
            unsubscribeBloqueios = null;
        }
        if (typeof unsubscribeSolicitacoes !== 'undefined' && unsubscribeSolicitacoes) {
            unsubscribeSolicitacoes();
            unsubscribeSolicitacoes = null;
        }
        await auth.signOut();
        window.location.href = 'index.html';
    } catch (error) {
        console.error("Erro ao fazer logout:", error);
    }
}

function isUsuarioInterno() {
    return currentUser && (currentUser.tipo === 'admin' || currentUser.tipo === 'colaborador');
}

function trocarAba(aba) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    const btn = document.querySelector(`.tab-btn[data-tab="${aba}"]`);
    if (btn) btn.classList.add('active');
    
    const content = document.getElementById(aba + 'Tab');
    if (content) content.classList.add('active');
}

// ==================== CRIAR CONTA ADMINISTRADOR (LEGADO) ====================
async function criarContaAdmin() {
    alert('⚠️ O sistema agora usa solicitação de acesso.\n\n' +
          '1. Clique em "Solicitar Acesso" para criar uma solicitação\n' +
          '2. Aguarde a aprovação do administrador\n\n' +
          'Ou use o console (F12) e digite: criarAdminInicial()');
}

// ==================== CRIAÇÃO DE ADMIN (COM LIMITE CONFIGURÁVEL) ====================
async function criarAdminInicial() {
    try {
        const limiteInfo = await verificarLimiteAdmin();
        
        if (!limiteInfo.podeCriar) {
            alert(`❌ Limite de administradores atingido!\n\n${limiteInfo.mensagem}`);
            return;
        }
        
        alert(`ℹ️ Limite atual: ${limiteInfo.limite} administradores\n\n${limiteInfo.mensagem}`);
    } catch (error) {
        console.error("Erro ao verificar limite:", error);
        alert("❌ Erro ao verificar limite de administradores: " + error.message);
        return;
    }

    const email = prompt('Digite o e-mail do administrador:');
    if (!email) return;
    
    const senha = prompt('Digite a senha (mínimo 6 caracteres):');
    if (!senha) return;
    
    if (senha.length < 6) {
        alert('A senha deve ter pelo menos 6 caracteres.');
        return;
    }
    
    const nome = prompt('Digite o nome completo:');
    if (!nome) return;

    try {
        const limiteInfo = await verificarLimiteAdmin();
        if (!limiteInfo.podeCriar) {
            alert(`❌ Limite de administradores atingido!\n\n${limiteInfo.mensagem}`);
            return;
        }

        const userCred = await auth.createUserWithEmailAndPassword(email, senha);
        const uid = userCred.user.uid;
        
        await db.collection('usuarios').doc(uid).set({
            uid: uid,
            nome: nome,
            email: email,
            tipo: 'admin',
            aprovado: true,
            criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
            criadoPor: 'sistema'
        });

        await db.collection('solicitacoesCadastro').doc(uid).set({
            uid: uid,
            nome: nome,
            email: email,
            status: 'aprovado',
            criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
            aprovadoEm: firebase.firestore.FieldValue.serverTimestamp(),
            aprovadoPor: 'sistema'
        });

        const novaInfo = await verificarLimiteAdmin();
        alert(`✅ Administrador criado com sucesso!\n\n📧 Email: ${email}\n🔑 Senha: ${senha}\n👤 Nome: ${nome}\n\n${novaInfo.mensagem}`);
    } catch (error) {
        console.error("Erro ao criar admin:", error);
        if (error.code === 'auth/email-already-in-use') {
            alert('Este e-mail já está em uso. Tente outro e-mail.');
        } else if (error.code === 'auth/weak-password') {
            alert('A senha é muito fraca. Use pelo menos 6 caracteres.');
        } else if (error.code === 'permission-denied' || (error.message && error.message.includes('Missing or insufficient permissions'))) {
            alert('❌ Erro de permissão no banco de dados.\n\n' +
                  'Para criar o primeiro administrador, ajuste as regras de segurança do Firestore no Firebase Console:\n\n' +
                  '1. Acesse Firebase Console → Firestore → Regras\n' +
                  '2. Adicione uma regra que permita criação de usuários\n' +
                  '3. Ou crie o usuário manualmente no Firebase Console');
        } else {
            alert('Erro: ' + error.message);
        }
    }
}

// ==================== ADMIN ====================
async function carregarAdmin() {
    if (!currentUser) {
        console.log("⚠️ Usuário não logado");
        return;
    }
    
    console.log("📋 Carregando admin para:", currentUser.nome, "Tipo:", currentUser.tipo);
    
    document.getElementById('adminName').textContent = currentUser.nome;
    
    forcarAtualizacaoMenu(currentUser);
    
    setTimeout(() => { forcarAtualizacaoMenu(currentUser); }, 100);
    setTimeout(() => { forcarAtualizacaoMenu(currentUser); }, 300);
    setTimeout(() => { forcarAtualizacaoMenu(currentUser); }, 800);
    setTimeout(() => { forcarAtualizacaoMenu(currentUser); }, 1500);
    
    definirSecaoInicial(currentUser);
    
    try {
        const configDoc = await db.collection('configuracoes').doc('geral').get();
        if (configDoc.exists) {
            const config = configDoc.data();
            document.querySelectorAll('.dias-check input').forEach(cb => {
                cb.checked = config.diasUteis?.includes(parseInt(cb.value));
            });
            document.getElementById('horaInicio').value = config.horaInicio || '09:00';
            document.getElementById('horaFim').value = config.horaFim || '18:00';
            document.getElementById('duracao').value = config.duracao || 60;
        }
        
        await carregarConfiguracoesDemanda();
        await carregarConfiguracoesHorarios();
        await carregarBloqueiosHorarios();
        await carregarConfigLimiteAdmin();
        
        iniciarListenerBloqueios();
        
        iniciarListenersRealtime();
        
        if (currentUser.tipo === 'admin') {
            iniciarDashboard();
        }
        
    } catch (error) {
        console.error("Erro ao carregar admin:", error);
    }
    
    iniciarSidebar();
    
    setTimeout(() => {
        reiniciarSidebar();
    }, 500);
}

// ==================== LISTENERS EM TEMPO REAL ====================
function iniciarListenersRealtime() {
    if (unsubscribeColaboradores) {
        unsubscribeColaboradores();
    }
    
    unsubscribeColaboradores = db.collection('colaboradores')
        .orderBy('nome', 'asc')
        .onSnapshot((snapshot) => {
            console.log("🔄 Colaboradores atualizados em tempo real!");
            colaboradoresCache = [];
            snapshot.forEach(doc => {
                colaboradoresCache.push({ id: doc.id, ...doc.data() });
            });
            atualizarSelectColaboradores();
            atualizarListaColaboradores();
            atualizarSelectReservaResponsavel();
        }, (error) => {
            console.error("Erro no listener de colaboradores:", error);
        });

    if (unsubscribeEventos) {
        unsubscribeEventos();
    }
    
    const hoje = new Date();
    const dataHoje = hoje.toISOString().split('T')[0];
    const dataInicio = dataHoje + 'T00:00:00.000Z';
    const dataFim = dataHoje + 'T23:59:59.999Z';
    
    unsubscribeEventos = db.collection('eventosAgenda')
        .where('data', '>=', dataInicio)
        .where('data', '<=', dataFim)
        .orderBy('data', 'asc')
        .onSnapshot((snapshot) => {
            console.log("🔄 Eventos do dia atual carregados!");
            
            const statusFiltro = document.getElementById('filtroStatus')?.value || '';
            let eventos = [];
            snapshot.forEach(doc => {
                eventos.push({ id: doc.id, ...doc.data() });
            });
            
            if (statusFiltro) {
                eventos = eventos.filter(e => e.status === statusFiltro);
            }
            
            const snapshotSimulado = {
                forEach: (callback) => {
                    eventos.forEach(e => {
                        callback({
                            id: e.id,
                            data: () => ({ ...e })
                        });
                    });
                },
                size: eventos.length,
                docs: eventos.map(e => ({
                    id: e.id,
                    data: () => ({ ...e })
                })),
                docChanges: () => []
            };
            
            atualizarListaEventos(snapshotSimulado);
            atualizarContadorStatus(snapshotSimulado);
            
            const filtroDataInput = document.getElementById('filtroData');
            if (filtroDataInput && !filtroDataInput.value) {
                filtroDataInput.value = dataHoje;
            }
            
            atualizarDataExibicao(dataHoje);
        }, (error) => {
            console.error("Erro no listener de eventos:", error);
        });

    iniciarListenerFerias();
    iniciarListenerReservas();
}

function atualizarSelectColaboradores() {
    const select = document.getElementById('eventoResponsavel');
    if (select) {
        select.innerHTML = '<option value="">Selecione um colaborador...</option>';
        colaboradoresCache.filter(c => c.ativo !== false).forEach(c => {
            const option = document.createElement('option');
            option.value = c.id;
            const emFerias = colaboradorEstaDeFerias(c.id);
            option.textContent = `${c.nome} ${c.cargo ? ' - ' + c.cargo : ''}`;
            if (emFerias) {
                option.textContent += ' 🏖️ (Férias)';
                option.style.color = '#f59e0b';
                option.style.fontWeight = '500';
            }
            select.appendChild(option);
        });
    }
}

function atualizarSelectReservaResponsavel() {
    const select = document.getElementById('reservaResponsavel');
    if (select) {
        const currentValue = select.value;
        select.innerHTML = '<option value="">Selecione um colaborador...</option>';
        colaboradoresCache.filter(c => c.ativo !== false).forEach(c => {
            const option = document.createElement('option');
            option.value = c.id;
            option.textContent = `${c.nome} ${c.cargo ? ' - ' + c.cargo : ''}`;
            if (colaboradorEstaDeFerias(c.id)) {
                option.textContent += ' 🏖️ (Férias)';
                option.style.color = '#f59e0b';
                option.style.fontWeight = '500';
            }
            select.appendChild(option);
        });
        if (currentValue) {
            select.value = currentValue;
        }
    }
}

// ==================== LISTA DE COLABORADORES ====================
function atualizarListaColaboradores() {
    const container = document.getElementById('listaColaboradores');
    if (!container) return;

    if (colaboradoresCache.length === 0) {
        container.innerHTML = `
            <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <i class="fas fa-users" style="font-size: 48px; color: #cbd5e1;"></i>
                <h3 style="margin-top: 12px; color: #475569;">Nenhum colaborador cadastrado</h3>
                <p style="color: #94a3b8;">Cadastre colaboradores para designá-los aos eventos.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    colaboradoresCache.forEach(c => {
        const emFerias = colaboradorEstaDeFerias(c.id);
        
        const card = document.createElement('div');
        card.className = 'card';
        card.id = `card-colaborador-${c.id}`;
        if (emFerias) {
            card.style.borderLeft = '4px solid #f59e0b';
        }
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap; gap: 8px;">
                <div style="flex: 1;">
                    <h3 style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                        <i class="fas fa-user" style="color: ${emFerias ? '#f59e0b' : '#2563eb'};"></i>
                        ${c.nome}
                        <span class="status-badge ${c.ativo !== false ? 'status-aprovado' : 'status-rejeitado'}" style="font-size: 11px; padding: 2px 10px;">
                            ${c.ativo !== false ? '✅ Ativo' : '❌ Inativo'}
                        </span>
                        ${emFerias ? `
                            <span class="status-badge" style="background: #fef3c7; color: #d97706; font-size: 11px; padding: 2px 10px;">
                                🏖️ Férias
                            </span>
                        ` : ''}
                    </h3>
                    <p><i class="fas fa-envelope" style="color: #64748b;"></i> ${c.email}</p>
                    ${c.telefone ? `<p><i class="fas fa-phone" style="color: #64748b;"></i> ${c.telefone}</p>` : ''}
                    ${c.cargo ? `<p><i class="fas fa-briefcase" style="color: #64748b;"></i> ${c.cargo}</p>` : ''}
                    ${c.observacoes ? `<p style="margin-top: 6px; color: #64748b; font-size: 13px;"><i class="fas fa-info-circle"></i> ${c.observacoes}</p>` : ''}
                    <p style="margin-top: 4px; font-size: 12px; color: #94a3b8;">
                        <i class="fas fa-clock"></i> Criado em: ${c.criadoEm ? new Date(c.criadoEm.seconds * 1000).toLocaleDateString('pt-BR') : 'Data não disponível'}
                    </p>
                </div>
            </div>
            <div style="margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap;">
                <button class="btn-sm btn-info" onclick="editarColaborador('${c.id}')" title="Editar colaborador">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn-sm" style="background: #8b5cf6; color: white;" onclick="exibirRelatorioDemanda('${c.id}')" title="Ver demanda do colaborador">
                    <i class="fas fa-chart-bar"></i> Demanda
                </button>
                ${emFerias ? `
                    <button class="btn-sm" style="background: #fef3c7; color: #d97706; cursor: default;" title="Colaborador em férias">
                        <i class="fas fa-umbrella-beach"></i> Em Férias
                    </button>
                ` : ''}
                <button class="btn-sm ${c.ativo !== false ? 'btn-warning' : 'btn-aprovar'}" onclick="toggleColaborador('${c.id}', ${c.ativo !== false})" title="${c.ativo !== false ? 'Desativar' : 'Ativar'} colaborador">
                    <i class="fas ${c.ativo !== false ? 'fa-pause' : 'fa-play'}"></i>
                    ${c.ativo !== false ? 'Desativar' : 'Ativar'}
                </button>
                <button class="btn-sm btn-rejeitar" onclick="confirmarExcluirColaborador('${c.id}', '${c.nome}')" title="Excluir colaborador">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

// ==================== EDIÇÃO DE COLABORADORES ====================
function editarColaborador(id) {
    const colaborador = colaboradoresCache.find(c => c.id === id);
    if (!colaborador) {
        alert('Colaborador não encontrado!');
        return;
    }

    colaboradorEmEdicao = id;

    document.getElementById('editColabId').value = id;
    document.getElementById('editColabNome').value = colaborador.nome || '';
    document.getElementById('editColabEmail').value = colaborador.email || '';
    document.getElementById('editColabTelefone').value = colaborador.telefone || '';
    document.getElementById('editColabCargo').value = colaborador.cargo || '';
    document.getElementById('editColabObservacoes').value = colaborador.observacoes || '';
    document.getElementById('editColabAtivo').checked = colaborador.ativo !== false;

    const modal = document.getElementById('modalEditarColaborador');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function fecharModalEditarColaborador() {
    const modal = document.getElementById('modalEditarColaborador');
    if (modal) {
        modal.style.display = 'none';
    }
    colaboradorEmEdicao = null;
}

async function salvarEdicaoColaborador() {
    const id = document.getElementById('editColabId').value;
    const nome = document.getElementById('editColabNome').value.trim();
    const email = document.getElementById('editColabEmail').value.trim();
    const telefone = document.getElementById('editColabTelefone').value.trim();
    const cargo = document.getElementById('editColabCargo').value.trim();
    const observacoes = document.getElementById('editColabObservacoes').value.trim();
    const ativo = document.getElementById('editColabAtivo').checked;

    if (!nome || !email) {
        alert('❌ Nome e E-mail são obrigatórios!');
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('❌ Por favor, insira um e-mail válido.');
        return;
    }

    if (!confirm(`Deseja salvar as alterações do colaborador "${nome}"?`)) {
        return;
    }

    try {
        const colaboradorAntigo = colaboradoresCache.find(c => c.id === id);
        
        await db.collection('colaboradores').doc(id).update({
            nome: nome,
            email: email,
            telefone: telefone || '',
            cargo: cargo || '',
            observacoes: observacoes || '',
            ativo: ativo,
            atualizadoEm: firebase.firestore.FieldValue.serverTimestamp(),
            atualizadoPor: currentUser.uid,
            atualizadoPorNome: currentUser.nome
        });

        if (colaboradorAntigo && colaboradorAntigo.nome !== nome) {
            console.log(`🔄 Atualizando eventos do colaborador: ${colaboradorAntigo.nome} -> ${nome}`);
            
            const eventosSnapshot = await db.collection('eventosAgenda')
                .where('responsavelId', '==', id)
                .get();
            
            let eventosAtualizados = 0;
            const batch = db.batch();
            
            eventosSnapshot.forEach(doc => {
                const eventoRef = db.collection('eventosAgenda').doc(doc.id);
                batch.update(eventoRef, {
                    responsavelNome: nome,
                    responsavelEmail: email,
                    responsavelCargo: cargo || '',
                    atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
                });
                eventosAtualizados++;
            });
            
            if (eventosAtualizados > 0) {
                await batch.commit();
                console.log(`✅ ${eventosAtualizados} eventos atualizados com o novo nome do colaborador`);
            }
        }

        alert('✅ Colaborador atualizado com sucesso!');
        fecharModalEditarColaborador();

    } catch (error) {
        console.error("Erro ao salvar edição:", error);
        alert('❌ Erro ao salvar: ' + error.message);
    }
}

async function atualizarEventosColaborador(colaboradorId) {
    const colaborador = colaboradoresCache.find(c => c.id === colaboradorId);
    if (!colaborador) {
        alert('❌ Colaborador não encontrado!');
        return;
    }

    if (!confirm(`Deseja atualizar todos os eventos do colaborador "${colaborador.nome}" com os dados atuais?`)) {
        return;
    }

    try {
        const eventosSnapshot = await db.collection('eventosAgenda')
            .where('responsavelId', '==', colaboradorId)
            .get();
        
        if (eventosSnapshot.empty) {
            alert('ℹ️ Nenhum evento encontrado para este colaborador.');
            return;
        }

        let eventosAtualizados = 0;
        const batch = db.batch();
        
        eventosSnapshot.forEach(doc => {
            const eventoRef = db.collection('eventosAgenda').doc(doc.id);
            batch.update(eventoRef, {
                responsavelNome: colaborador.nome,
                responsavelEmail: colaborador.email,
                responsavelCargo: colaborador.cargo || '',
                atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
            });
            eventosAtualizados++;
        });
        
        if (eventosAtualizados > 0) {
            await batch.commit();
            alert(`✅ ${eventosAtualizados} eventos atualizados com sucesso!`);
        }
        
    } catch (error) {
        console.error("Erro ao atualizar eventos:", error);
        alert('❌ Erro ao atualizar eventos: ' + error.message);
    }
}

// ==================== GESTÃO DE FÉRIAS ====================
function iniciarListenerFerias() {
    if (unsubscribeFerias) {
        unsubscribeFerias();
    }
    
    try {
        unsubscribeFerias = db.collection('ferias')
            .orderBy('dataInicio', 'asc')
            .onSnapshot((snapshot) => {
                console.log("🔄 Férias atualizadas em tempo real!");
                feriasCache = [];
                snapshot.forEach(doc => {
                    feriasCache.push({ id: doc.id, ...doc.data() });
                });
                atualizarListaFerias();
                atualizarFeriasNoDashboard();
            }, (error) => {
                console.error("Erro no listener de férias:", error);
            });
    } catch (error) {
        console.error("❌ Erro ao iniciar listener de férias:", error);
    }
}

function atualizarListaFerias() {
    const container = document.getElementById('listaFerias');
    if (!container) return;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const feriasAtivas = feriasCache.filter(f => {
        const dataFim = new Date(f.dataFim);
        dataFim.setHours(0, 0, 0, 0);
        return dataFim >= hoje;
    });

    if (feriasAtivas.length === 0) {
        container.innerHTML = `
            <div class="empty-events">
                <i class="fas fa-umbrella-beach" style="font-size: 28px;"></i>
                <span>Nenhum profissional em férias</span>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    feriasAtivas.forEach(f => {
        const colaborador = colaboradoresCache.find(c => c.id === f.colaboradorId);
        const nomeColaborador = colaborador ? colaborador.nome : 'Colaborador removido';
        
        const dataInicio = formatarDataParaExibicao(f.dataInicio);
        const dataFim = formatarDataParaExibicao(f.dataFim);
        
        const item = document.createElement('div');
        item.className = 'evento-item';
        item.style.borderLeft = '3px solid #f59e0b';
        item.style.paddingLeft = '12px';
        item.style.marginBottom = '8px';
        item.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; flex-wrap: wrap; gap: 4px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-user" style="color: #f59e0b;"></i>
                    <span style="font-weight: 500; font-size: 14px;">${nomeColaborador}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 12px; font-size: 13px; color: #64748b;">
                    <span><i class="fas fa-calendar-day"></i> ${dataInicio}</span>
                    <span><i class="fas fa-arrow-right"></i></span>
                    <span><i class="fas fa-calendar-day"></i> ${dataFim}</span>
                    <button class="btn-sm btn-rejeitar" onclick="excluirFerias('${f.id}')" title="Remover férias" style="padding: 2px 8px; font-size: 11px;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            ${f.observacoes ? `<div style="font-size: 12px; color: #94a3b8; margin-top: 2px;"><i class="fas fa-info-circle"></i> ${f.observacoes}</div>` : ''}
        `;
        container.appendChild(item);
    });
}

function abrirModalFerias() {
    const select = document.getElementById('feriasColaborador');
    if (select) {
        select.innerHTML = '<option value="">Selecione um colaborador...</option>';
        colaboradoresCache.filter(c => c.ativo !== false).forEach(c => {
            const emFerias = colaboradorEstaDeFerias(c.id);
            const option = document.createElement('option');
            option.value = c.id;
            option.textContent = `${c.nome} ${c.cargo ? ' - ' + c.cargo : ''}`;
            if (emFerias) {
                option.textContent += ' (Já em férias)';
                option.disabled = true;
            }
            select.appendChild(option);
        });
    }
    
    document.getElementById('feriasId').value = '';
    document.getElementById('feriasDataInicio').value = '';
    document.getElementById('feriasDataFim').value = '';
    document.getElementById('feriasObservacoes').value = '';
    
    const modal = document.getElementById('modalFerias');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function fecharModalFerias() {
    const modal = document.getElementById('modalFerias');
    if (modal) {
        modal.style.display = 'none';
    }
}

async function salvarFerias() {
    const colaboradorId = document.getElementById('feriasColaborador').value;
    const dataInicio = document.getElementById('feriasDataInicio').value;
    const dataFim = document.getElementById('feriasDataFim').value;
    const observacoes = document.getElementById('feriasObservacoes').value.trim();
    const feriasId = document.getElementById('feriasId').value;

    if (!colaboradorId || !dataInicio || !dataFim) {
        alert('❌ Preencha todos os campos obrigatórios!');
        return;
    }

    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    if (fim < inicio) {
        alert('❌ A data de fim deve ser maior ou igual à data de início!');
        return;
    }

    const colaborador = colaboradoresCache.find(c => c.id === colaboradorId);
    if (!colaborador) {
        alert('❌ Colaborador não encontrado!');
        return;
    }

    try {
        const dados = {
            colaboradorId: colaboradorId,
            colaboradorNome: colaborador.nome,
            dataInicio: dataInicio + 'T00:00:00.000Z',
            dataFim: dataFim + 'T23:59:59.999Z',
            observacoes: observacoes || '',
            ativo: true,
            atualizadoEm: firebase.firestore.FieldValue.serverTimestamp(),
            atualizadoPor: currentUser.uid,
            atualizadoPorNome: currentUser.nome
        };

        if (feriasId) {
            await db.collection('ferias').doc(feriasId).update(dados);
            alert('✅ Férias atualizadas com sucesso!');
        } else {
            dados.criadoEm = firebase.firestore.FieldValue.serverTimestamp();
            dados.criadoPor = currentUser.uid;
            dados.criadoPorNome = currentUser.nome;
            await db.collection('ferias').add(dados);
            alert('✅ Férias registradas com sucesso!');
        }
        
        fecharModalFerias();

    } catch (error) {
        console.error("Erro ao salvar férias:", error);
        alert('❌ Erro ao salvar: ' + error.message);
    }
}

async function excluirFerias(id) {
    if (!confirm('Deseja remover este registro de férias? O colaborador será liberado.')) {
        return;
    }
    
    try {
        await db.collection('ferias').doc(id).delete();
        alert('✅ Registro de férias removido com sucesso!');
    } catch (error) {
        console.error("Erro ao excluir férias:", error);
        alert('❌ Erro ao excluir: ' + error.message);
    }
}

function colaboradorEstaDeFerias(colaboradorId) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    return feriasCache.some(f => {
        if (f.colaboradorId !== colaboradorId) return false;
        const dataFim = new Date(f.dataFim);
        dataFim.setHours(0, 0, 0, 0);
        return dataFim >= hoje;
    });
}

function atualizarFeriasNoDashboard() {
    atualizarListaFerias();
}

// ==================== ATUALIZAR LISTA DE EVENTOS ====================
function atualizarListaEventos(snapshot) {
    const container = document.getElementById('listaEventosAdmin');
    if (!container) return;

    let eventos = [];
    snapshot.forEach(doc => {
        eventos.push({ id: doc.id, ...doc.data() });
    });

    if (eventos.length === 0) {
        container.innerHTML = `
            <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                <i class="fas fa-calendar-day" style="font-size: 48px; color: #cbd5e1;"></i>
                <h3 style="margin-top: 12px; color: #475569;">Nenhum evento encontrado para esta data</h3>
                <p style="color: #94a3b8;">Use os filtros para navegar para outras datas ou ver todos os eventos.</p>
                <div style="margin-top: 12px; display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
                    <button class="btn-sm" style="background: #2563eb; color: white;" onclick="irParaHoje()">
                        <i class="fas fa-calendar-day"></i> Ir para Hoje
                    </button>
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    eventos.forEach(e => {
        const dataISO = e.data ? e.data.split('T')[0] : '';
        const horaISO = e.data ? e.data.split('T')[1]?.substring(0, 5) || '' : '';
        const dataParts = dataISO ? dataISO.split('-') : [];
        const dataStr = dataParts.length === 3 ? `${dataParts[2]}/${dataParts[1]}/${dataParts[0]}` : 'Data não definida';
        const horaStr = horaISO || '--:--';

        const status = e.status || 'designado';
        const statusLabel = STATUS_LABELS[status] || status;
        const statusColor = STATUS_COLORS[status] || '#f1f5f9';
        const statusTextColor = STATUS_TEXT_COLORS[status] || '#1e293b';
        const statusIcon = STATUS_ICONS[status] || 'fa-circle';

        let botoesStatus = '';
        if (status === 'designado') {
            botoesStatus = `
                <button class="btn-sm btn-em_andamento" onclick="alterarStatus('${e.id}', 'em_andamento')">
                    <i class="fas fa-play"></i> Iniciar
                </button>
                <button class="btn-sm btn-cancelado" onclick="alterarStatus('${e.id}', 'cancelado')">
                    <i class="fas fa-times"></i> Cancelar
                </button>
            `;
        } else if (status === 'em_andamento') {
            botoesStatus = `
                <button class="btn-sm btn-realizado" onclick="alterarStatus('${e.id}', 'realizado')">
                    <i class="fas fa-check"></i> Concluir
                </button>
                <button class="btn-sm btn-cancelado" onclick="alterarStatus('${e.id}', 'cancelado')">
                    <i class="fas fa-times"></i> Cancelar
                </button>
            `;
        } else if (status === 'realizado' || status === 'cancelado') {
            botoesStatus = `
                <button class="btn-sm btn-designado" onclick="alterarStatus('${e.id}', 'designado')">
                    <i class="fas fa-undo"></i> Reabrir
                </button>
            `;
        }

        const card = document.createElement('div');
        card.className = 'card';
        card.id = `card-evento-${e.id}`;
        card.style.borderLeft = `4px solid ${TIPO_BORDER_COLORS[e.tipo] || '#2563eb'}`;
        
        let infoExtra = '';
        if (e.ticket) {
            infoExtra += `
                <span style="display: inline-block; font-size: 12px; background: #f1f5f9; color: #475569; padding: 2px 10px; border-radius: 12px; margin-right: 6px;">
                    <i class="fas fa-ticket-alt"></i> ${e.ticket}
                </span>
            `;
        }
        if (e.municipio) {
            infoExtra += `
                <span style="display: inline-block; font-size: 12px; background: #e0e7ff; color: #4338ca; padding: 2px 10px; border-radius: 12px;">
                    <i class="fas fa-city"></i> ${e.municipio}
                </span>
            `;
        }
        
        const dataHoraInfo = `
            <span><i class="fas fa-calendar-day" style="color: #2563eb;"></i> ${dataStr}</span>
            <span><i class="fas fa-clock" style="color: #2563eb;"></i> ${horaStr}</span>
            ${e.duracao ? `<span><i class="fas fa-hourglass-half" style="color: #2563eb;"></i> ${e.duracao} min</span>` : ''}
        `;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'card-content';
        contentDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap; gap: 8px; margin-bottom: 8px;">
                <span class="status-badge" style="background: ${TIPO_COLORS[e.tipo] || '#f1f5f9'}; color: #1e293b;">
                    ${TIPO_LABELS[e.tipo] || e.tipo}
                </span>
                <span class="status-badge" style="background: ${statusColor}; color: ${statusTextColor}; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
                    <i class="fas ${statusIcon}"></i>
                    ${statusLabel}
                </span>
            </div>
            
            ${infoExtra ? `<div style="margin-bottom: 8px; display: flex; flex-wrap: wrap; gap: 4px;">${infoExtra}</div>` : ''}
            
            <div style="margin: 8px 0; display: flex; gap: 16px; font-size: 14px; color: #64748b; flex-wrap: wrap;">
                ${dataHoraInfo}
            </div>
            
            <h3 style="margin: 6px 0; font-size: 18px;">${e.titulo}</h3>
            
            <div style="margin: 6px 0; padding: 8px 12px; background: #f0f7ff; border-radius: 8px; border-left: 3px solid #2563eb;">
                <p style="font-size: 14px; font-weight: 500; color: #1e293b;">
                    <i class="fas fa-user-tie" style="color: #2563eb;"></i> 
                    ${e.responsavelNome || 'Não definido'}
                    ${e.responsavelCargo ? ` - ${e.responsavelCargo}` : ''}
                </p>
                ${e.responsavelEmail ? `<p style="font-size: 12px; color: #64748b; margin-top: 2px;"><i class="fas fa-envelope"></i> ${e.responsavelEmail}</p>` : ''}
            </div>
            
            ${e.descricao ? `<p style="color: #475569; font-size: 14px; margin: 4px 0;"><i class="fas fa-info-circle" style="color: #64748b;"></i> ${e.descricao}</p>` : ''}
            ${e.local ? `<p style="color: #475569; font-size: 14px; margin: 2px 0;"><i class="fas fa-map-marker-alt" style="color: #64748b;"></i> ${e.local}</p>` : ''}
            ${e.participantes ? `<p style="color: #475569; font-size: 14px; margin: 2px 0;"><i class="fas fa-users" style="color: #64748b;"></i> ${e.participantes} participantes</p>` : ''}
            
            <div class="card-actions">
                ${botoesStatus}
                <button class="btn-edit" onclick="editarEvento('${e.id}')">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn-sm btn-rejeitar" onclick="excluirEvento('${e.id}')">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </div>
        `;
        
        card.appendChild(contentDiv);
        container.appendChild(card);
    });
}

// ==================== CONTADOR DE STATUS ====================
function atualizarContadorStatus(snapshot) {
    const eventos = [];
    snapshot.forEach(doc => {
        eventos.push({ id: doc.id, ...doc.data() });
    });

    const statusCount = {
        designado: 0,
        em_andamento: 0,
        realizado: 0,
        cancelado: 0
    };

    eventos.forEach(e => {
        const status = e.status || 'designado';
        if (statusCount.hasOwnProperty(status)) {
            statusCount[status]++;
        }
    });

    const total = eventos.length;

    const countDesignado = document.getElementById('countDesignado');
    const countEmAndamento = document.getElementById('countEmAndamento');
    const countRealizado = document.getElementById('countRealizado');
    const countCancelado = document.getElementById('countCancelado');
    const countTotal = document.getElementById('countTotal');

    if (countDesignado) countDesignado.textContent = statusCount.designado;
    if (countEmAndamento) countEmAndamento.textContent = statusCount.em_andamento;
    if (countRealizado) countRealizado.textContent = statusCount.realizado;
    if (countCancelado) countCancelado.textContent = statusCount.cancelado;
    if (countTotal) countTotal.textContent = total;
}

// ==================== FILTROS POR STATUS ====================
function filtrarPorStatus(status) {
    document.getElementById('filtroStatus').value = status;
    filtroStatusAtual = status;
    aplicarFiltrosCompletos();
}

// ==================== APLICAR FILTROS COMPLETOS ====================
function aplicarFiltrosCompletos() {
    const dataFiltro = document.getElementById('filtroData').value;
    const statusFiltro = document.getElementById('filtroStatus').value;
    
    filtroDataAtual = dataFiltro;
    filtroStatusAtual = statusFiltro;

    let dataConsulta = dataFiltro;
    if (!dataConsulta) {
        const hoje = new Date();
        dataConsulta = hoje.toISOString().split('T')[0];
    }

    const container = document.getElementById('listaEventosAdmin');
    container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Carregando eventos...</div>';

    if (unsubscribeEventos) {
        unsubscribeEventos();
    }

    const dataInicio = dataConsulta + 'T00:00:00.000Z';
    const dataFim = dataConsulta + 'T23:59:59.999Z';
    
    let query = db.collection('eventosAgenda')
        .where('data', '>=', dataInicio)
        .where('data', '<=', dataFim)
        .orderBy('data', 'asc');

    unsubscribeEventos = query.onSnapshot((snapshot) => {
        let eventos = [];
        snapshot.forEach(doc => {
            eventos.push({ id: doc.id, ...doc.data() });
        });
        
        if (statusFiltro) {
            eventos = eventos.filter(e => e.status === statusFiltro);
        }
        
        eventos.sort((a, b) => {
            if (a.data < b.data) return -1;
            if (a.data > b.data) return 1;
            return 0;
        });
        
        const snapshotSimulado = {
            forEach: (callback) => {
                eventos.forEach(e => {
                    callback({
                        id: e.id,
                        data: () => ({ ...e })
                    });
                });
            },
            size: eventos.length,
            docs: eventos.map(e => ({
                id: e.id,
                data: () => ({ ...e })
            })),
            docChanges: () => []
        };
        
        atualizarListaEventos(snapshotSimulado);
        atualizarContadorStatus(snapshotSimulado);
        
        const filtroDataInput = document.getElementById('filtroData');
        if (filtroDataInput && !filtroDataInput.value) {
            filtroDataInput.value = dataConsulta;
        }
        
        atualizarDataExibicao(dataConsulta);
        
    }, (error) => {
        console.error("Erro ao filtrar:", error);
        container.innerHTML = `
            <div class="card" style="grid-column: 1 / -1; color: #ef4444; text-align: center; padding: 40px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 32px;"></i>
                <p style="margin-top: 8px;"><strong>Erro ao carregar eventos:</strong> ${error.message}</p>
                <button onclick="aplicarFiltrosCompletos()" style="margin-top: 12px; padding: 8px 20px; background: #2563eb; color: white; border: none; border-radius: 8px; cursor: pointer;">
                    <i class="fas fa-redo"></i> Tentar novamente
                </button>
            </div>
        `;
    });
}

// ==================== ALTERAR STATUS DO EVENTO ====================
async function alterarStatus(eventoId, novoStatus) {
    const statusLabels = {
        'designado': '📋 Designado',
        'em_andamento': '🔄 Em Andamento',
        'realizado': '✅ Realizado',
        'cancelado': '❌ Cancelado'
    };

    if (!confirm(`Deseja alterar o status deste evento para "${statusLabels[novoStatus]}"?`)) {
        return;
    }

    try {
        await db.collection('eventosAgenda').doc(eventoId).update({
            status: novoStatus,
            statusAtualizadoEm: firebase.firestore.FieldValue.serverTimestamp(),
            statusAtualizadoPor: currentUser.uid,
            statusAtualizadoPorNome: currentUser.nome
        });

        alert(`✅ Status alterado para "${statusLabels[novoStatus]}" com sucesso!`);

    } catch (error) {
        console.error("Erro ao alterar status:", error);
        alert('❌ Erro ao alterar status: ' + error.message);
    }
}

// ==================== FILTROS ====================
function filtrarAgenda() {
    aplicarFiltrosCompletos();
}

function limparFiltros() {
    document.getElementById('filtroData').value = '';
    document.getElementById('filtroStatus').value = '';
    filtroDataAtual = '';
    filtroStatusAtual = '';
    
    const hoje = new Date();
    const dataHoje = hoje.toISOString().split('T')[0];
    document.getElementById('filtroData').value = dataHoje;
    aplicarFiltrosCompletos();
}

function verAgendaPublica() {
    window.open('agenda-publica.html', '_blank');
}

// ==================== MODAL ====================
function abrirModal(mensagem, callback, tipo = 'danger') {
    const modal = document.getElementById('modalConfirmacao');
    const mensagemEl = document.getElementById('modalMensagem');
    const btnConfirmar = document.getElementById('btnConfirmarExclusao');
    
    if (!modal || !mensagemEl || !btnConfirmar) {
        console.error("Elementos do modal não encontrados");
        return;
    }

    mensagemEl.innerHTML = mensagem;
    
    btnConfirmar.className = tipo === 'danger' ? 'modal-btn-confirmar' : 'modal-btn-confirmar-success';
    btnConfirmar.innerHTML = tipo === 'danger' ? '<i class="fas fa-trash"></i> Excluir' : '<i class="fas fa-check"></i> Confirmar';
    
    const newBtn = btnConfirmar.cloneNode(true);
    btnConfirmar.parentNode.replaceChild(newBtn, btnConfirmar);
    
    newBtn.addEventListener('click', function() {
        if (typeof callback === 'function') {
            callback();
        }
        fecharModal();
    });
    
    modal.style.display = 'flex';
}

function fecharModal() {
    const modal = document.getElementById('modalConfirmacao');
    if (modal) {
        modal.style.display = 'none';
    }
    eventoParaExcluir = null;
}

document.addEventListener('click', function(event) {
    const modal = document.getElementById('modalConfirmacao');
    if (modal && event.target === modal) {
        fecharModal();
    }
});

// ==================== COLABORADORES ====================
async function cadastrarColaborador() {
    const nome = document.getElementById('colabNome').value.trim();
    const email = document.getElementById('colabEmail').value.trim();
    const telefone = document.getElementById('colabTelefone').value.trim();
    const cargo = document.getElementById('colabCargo').value.trim();
    const observacoes = document.getElementById('colabObservacoes').value.trim();

    if (!nome || !email) {
        alert('Preencha os campos obrigatórios: Nome e E-mail.');
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Por favor, insira um e-mail válido.');
        return;
    }

    try {
        const existing = await db.collection('colaboradores')
            .where('email', '==', email)
            .get();

        if (!existing.empty) {
            alert('Já existe um colaborador cadastrado com este e-mail.');
            return;
        }

        await db.collection('colaboradores').add({
            nome: nome,
            email: email,
            telefone: telefone || '',
            cargo: cargo || '',
            observacoes: observacoes || '',
            ativo: true,
            criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
            criadoPor: currentUser.uid,
            criadoPorNome: currentUser.nome
        });

        alert('✅ Colaborador cadastrado com sucesso!');

        document.getElementById('colabNome').value = '';
        document.getElementById('colabEmail').value = '';
        document.getElementById('colabTelefone').value = '';
        document.getElementById('colabCargo').value = '';
        document.getElementById('colabObservacoes').value = '';

    } catch (error) {
        console.error("Erro ao cadastrar colaborador:", error);
        alert('Erro ao cadastrar: ' + error.message);
    }
}

async function toggleColaborador(id, ativo) {
    const novoStatus = !ativo;
    const acao = novoStatus ? 'ativar' : 'desativar';
    
    if (!confirm(`Tem certeza que deseja ${acao} este colaborador?`)) return;

    try {
        await db.collection('colaboradores').doc(id).update({
            ativo: novoStatus
        });
        alert(`✅ Colaborador ${acao}do com sucesso!`);
    } catch (error) {
        console.error("Erro ao alterar status:", error);
        alert('Erro: ' + error.message);
    }
}

function confirmarExcluirColaborador(id, nome) {
    eventoParaExcluir = { id, tipo: 'colaborador' };
    abrirModal(
        `Tem certeza que deseja excluir o colaborador "<strong>${nome}</strong>"? Esta ação não pode ser desfeita.`,
        excluirColaboradorConfirmado,
        'danger'
    );
}

async function excluirColaboradorConfirmado() {
    if (!eventoParaExcluir || eventoParaExcluir.tipo !== 'colaborador') {
        console.error("Nenhum colaborador para excluir");
        return;
    }
    
    try {
        await db.collection('colaboradores').doc(eventoParaExcluir.id).delete();
        alert('✅ Colaborador excluído com sucesso!');
    } catch (error) {
        console.error("Erro ao excluir colaborador:", error);
        alert('❌ Erro ao excluir: ' + error.message);
    } finally {
        eventoParaExcluir = null;
    }
}

// ==================== CONFIGURAÇÕES DE DEMANDA ====================

const CONFIG_DEMANDA_DOC = 'configuracoesDemanda';

async function carregarConfiguracoesDemanda() {
    try {
        const doc = await db.collection('configuracoes').doc(CONFIG_DEMANDA_DOC).get();
        
        if (doc.exists) {
            const config = doc.data();
            
            document.getElementById('configDemandaAtivo').checked = config.ativo !== false;
            document.getElementById('configLimiteDiario').value = config.limiteDiario || 5;
            document.getElementById('configLimiteSemanal').value = config.limiteSemanal || 15;
            document.getElementById('configLimiteMensal').value = config.limiteMensal || 30;
            document.getElementById('configCargaHoraria').value = config.cargaHorariaMaxima || 8;
            
            atualizarDisplayConfiguracoes(config);
            atualizarConstantesDemanda(config);
            
            console.log("✅ Configurações de demanda carregadas:", config);
        } else {
            const configPadrao = {
                ativo: true,
                limiteDiario: 5,
                limiteSemanal: 15,
                limiteMensal: 30,
                cargaHorariaMaxima: 8
            };
            atualizarDisplayConfiguracoes(configPadrao);
            atualizarConstantesDemanda(configPadrao);
        }
    } catch (error) {
        console.error("❌ Erro ao carregar configurações de demanda:", error);
    }
}

function atualizarDisplayConfiguracoes(config) {
    document.getElementById('displayLimiteDiario').textContent = config.limiteDiario || 5;
    document.getElementById('displayLimiteSemanal').textContent = config.limiteSemanal || 15;
    document.getElementById('displayLimiteMensal').textContent = config.limiteMensal || 30;
    document.getElementById('displayCargaHoraria').textContent = config.cargaHorariaMaxima || 8;
    
    const statusEl = document.getElementById('displayStatusDemanda');
    if (config.ativo !== false) {
        statusEl.textContent = '✅ Ativo';
        statusEl.style.color = '#10b981';
    } else {
        statusEl.textContent = '⛔ Desativado';
        statusEl.style.color = '#ef4444';
    }
}

async function salvarConfiguracoesDemanda() {
    const ativo = document.getElementById('configDemandaAtivo').checked;
    const limiteDiario = parseInt(document.getElementById('configLimiteDiario').value) || 5;
    const limiteSemanal = parseInt(document.getElementById('configLimiteSemanal').value) || 15;
    const limiteMensal = parseInt(document.getElementById('configLimiteMensal').value) || 30;
    const cargaHorariaMaxima = parseInt(document.getElementById('configCargaHoraria').value) || 8;

    if (limiteDiario < 1 || limiteDiario > 20) {
        alert('❌ O limite diário deve ser entre 1 e 20.');
        return;
    }
    if (limiteSemanal < 1 || limiteSemanal > 50) {
        alert('❌ O limite semanal deve ser entre 1 e 50.');
        return;
    }
    if (limiteMensal < 1 || limiteMensal > 100) {
        alert('❌ O limite mensal deve ser entre 1 e 100.');
        return;
    }
    if (cargaHorariaMaxima < 1 || cargaHorariaMaxima > 24) {
        alert('❌ A carga horária máxima deve ser entre 1 e 24 horas.');
        return;
    }

    try {
        const dados = {
            ativo: ativo,
            limiteDiario: limiteDiario,
            limiteSemanal: limiteSemanal,
            limiteMensal: limiteMensal,
            cargaHorariaMaxima: cargaHorariaMaxima,
            atualizadoEm: firebase.firestore.FieldValue.serverTimestamp(),
            atualizadoPor: currentUser?.uid || 'sistema',
            atualizadoPorNome: currentUser?.nome || 'sistema'
        };

        await db.collection('configuracoes').doc(CONFIG_DEMANDA_DOC).set(dados, { merge: true });
        
        atualizarDisplayConfiguracoes(dados);
        atualizarConstantesDemanda(dados);
        
        alert('✅ Configurações de demanda salvas com sucesso!');
        
    } catch (error) {
        console.error("❌ Erro ao salvar configurações de demanda:", error);
        alert('❌ Erro ao salvar: ' + error.message);
    }
}

function atualizarConstantesDemanda(config) {
    LIMITE_MAXIMO_EVENTOS_DIA = config.limiteDiario || 5;
    LIMITE_MAXIMO_EVENTOS_SEMANA = config.limiteSemanal || 15;
    LIMITE_MAXIMO_EVENTOS_MES = config.limiteMensal || 30;
    CARGA_HORARIA_MAXIMA = config.cargaHorariaMaxima || 8;
    DEMANDA_ATIVA = config.ativo !== false;
    
    console.log("🔄 Constantes de demanda atualizadas:", {
        dia: LIMITE_MAXIMO_EVENTOS_DIA,
        semana: LIMITE_MAXIMO_EVENTOS_SEMANA,
        mes: LIMITE_MAXIMO_EVENTOS_MES,
        carga: CARGA_HORARIA_MAXIMA,
        ativa: DEMANDA_ATIVA
    });
}

async function getConfiguracoesDemanda() {
    try {
        const doc = await db.collection('configuracoes').doc(CONFIG_DEMANDA_DOC).get();
        
        if (doc.exists) {
            return doc.data();
        } else {
            return {
                ativo: true,
                limiteDiario: 5,
                limiteSemanal: 15,
                limiteMensal: 30,
                cargaHorariaMaxima: 8
            };
        }
    } catch (error) {
        console.error("❌ Erro ao buscar configurações:", error);
        return {
            ativo: true,
            limiteDiario: 5,
            limiteSemanal: 15,
            limiteMensal: 30,
            cargaHorariaMaxima: 8
        };
    }
}

async function restaurarConfiguracoesDemandaPadrao() {
    if (!confirm('⚠️ Deseja restaurar as configurações padrão de demanda?')) {
        return;
    }

    const configPadrao = {
        ativo: true,
        limiteDiario: 5,
        limiteSemanal: 15,
        limiteMensal: 30,
        cargaHorariaMaxima: 8
    };

    try {
        await db.collection('configuracoes').doc(CONFIG_DEMANDA_DOC).set(configPadrao);
        
        document.getElementById('configDemandaAtivo').checked = configPadrao.ativo;
        document.getElementById('configLimiteDiario').value = configPadrao.limiteDiario;
        document.getElementById('configLimiteSemanal').value = configPadrao.limiteSemanal;
        document.getElementById('configLimiteMensal').value = configPadrao.limiteMensal;
        document.getElementById('configCargaHoraria').value = configPadrao.cargaHorariaMaxima;
        
        atualizarDisplayConfiguracoes(configPadrao);
        atualizarConstantesDemanda(configPadrao);
        
        alert('✅ Configurações restauradas para o padrão!');
        
    } catch (error) {
        console.error("❌ Erro ao restaurar configurações:", error);
        alert('❌ Erro ao restaurar: ' + error.message);
    }
}

// ==================== CONFIGURAÇÕES DE HORÁRIOS DISPONÍVEIS ====================

const CONFIG_HORARIOS_DOC = 'configuracoesHorarios';

async function carregarConfiguracoesHorarios() {
    try {
        const doc = await db.collection('configuracoes').doc(CONFIG_HORARIOS_DOC).get();
        
        if (doc.exists) {
            const config = doc.data();
            
            document.getElementById('configHorariosAtivo').checked = config.ativo !== false;
            document.getElementById('configHorarioInicio').value = config.horarioInicio || '08:00';
            document.getElementById('configHorarioFim').value = config.horarioFim || '18:00';
            document.getElementById('configIntervaloSlots').value = config.intervaloSlots || 60;
            document.getElementById('configDuracaoSlot').value = config.duracaoSlot || 60;
            document.getElementById('configEmailSuporte').value = config.emailSuporte || 'suporte@novetech.com.br';
            
            const diasDisponiveis = config.diasDisponiveis || [1, 2, 3, 4, 5];
            document.querySelectorAll('.dias-disponiveis').forEach(cb => {
                cb.checked = diasDisponiveis.includes(parseInt(cb.value));
            });
            
            atualizarDisplayHorarios(config);
            
            console.log("✅ Configurações de horários carregadas:", config);
        } else {
            document.getElementById('configHorariosAtivo').checked = true;
            document.getElementById('configHorarioInicio').value = '08:00';
            document.getElementById('configHorarioFim').value = '18:00';
            document.getElementById('configIntervaloSlots').value = 60;
            document.getElementById('configDuracaoSlot').value = 60;
            document.getElementById('configEmailSuporte').value = 'suporte@novetech.com.br';
            
            document.querySelectorAll('.dias-disponiveis').forEach(cb => {
                cb.checked = [1, 2, 3, 4, 5].includes(parseInt(cb.value));
            });
            
            atualizarDisplayHorarios(HORARIOS_PADRAO);
        }
        
        atualizarLinkAgendaPublica();
        
    } catch (error) {
        console.error("❌ Erro ao carregar configurações de horários:", error);
    }
}

function atualizarDisplayHorarios(config) {
    const ativo = config.ativo !== false;
    document.getElementById('displayHorariosStatus').textContent = ativo ? '✅ Ativo' : '⛔ Desativado';
    document.getElementById('displayHorariosStatus').style.color = ativo ? '#10b981' : '#ef4444';
    
    const dias = config.diasDisponiveis || [1, 2, 3, 4, 5];
    const nomesDias = dias.map(d => DIAS_SEMANA[d] || d).join(', ');
    document.getElementById('displayDiasDisponiveis').textContent = nomesDias || 'Nenhum dia selecionado';
    
    document.getElementById('displayHorarioExpediente').textContent = 
        `${config.horarioInicio || '08:00'} - ${config.horarioFim || '18:00'}`;
    
    document.getElementById('displayIntervaloSlots').textContent = 
        `${config.intervaloSlots || 60} min`;
    
    document.getElementById('displayDuracaoSlot').textContent = 
        `${config.duracaoSlot || 60} min`;
    
    document.getElementById('displayEmailSuporte').textContent = 
        config.emailSuporte || 'suporte@novetech.com.br';
}

function atualizarLinkAgendaPublica() {
    const link = document.getElementById('linkAgendaPublica');
    if (link) {
        const url = "https://pauloglebson01.github.io/AgendaNovetech/agenda-publica.html";
        link.textContent = url;
        link.href = url;
    }
}

function copiarLinkAgendaPublica() {
    const link = document.getElementById('linkAgendaPublica');
    if (link) {
        const url = link.textContent;
        navigator.clipboard.writeText(url).then(() => {
            alert('✅ Link da agenda pública copiado para a área de transferência!');
        }).catch(() => {
            const input = document.createElement('input');
            input.value = url;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
            alert('✅ Link copiado para a área de transferência!');
        });
    }
}

async function salvarConfiguracoesHorarios() {
    const ativo = document.getElementById('configHorariosAtivo').checked;
    const horarioInicio = document.getElementById('configHorarioInicio').value;
    const horarioFim = document.getElementById('configHorarioFim').value;
    const intervaloSlots = parseInt(document.getElementById('configIntervaloSlots').value) || 60;
    const duracaoSlot = parseInt(document.getElementById('configDuracaoSlot').value) || 60;
    const emailSuporte = document.getElementById('configEmailSuporte').value.trim();
    
    const diasDisponiveis = Array.from(document.querySelectorAll('.dias-disponiveis:checked'))
        .map(cb => parseInt(cb.value))
        .sort((a, b) => a - b);

    if (diasDisponiveis.length === 0) {
        alert('❌ Selecione pelo menos um dia da semana para agendamentos.');
        return;
    }
    
    if (!horarioInicio || !horarioFim) {
        alert('❌ Defina o horário de início e fim do expediente.');
        return;
    }
    
    if (horarioInicio >= horarioFim) {
        alert('❌ O horário de início deve ser menor que o horário de fim.');
        return;
    }
    
    if (intervaloSlots < 15 || intervaloSlots > 120) {
        alert('❌ O intervalo entre slots deve ser entre 15 e 120 minutos.');
        return;
    }
    
    if (duracaoSlot < 15 || duracaoSlot > 240) {
        alert('❌ A duração do slot deve ser entre 15 e 240 minutos.');
        return;
    }
    
    if (!emailSuporte || !emailSuporte.includes('@')) {
        alert('❌ Informe um e-mail de suporte válido.');
        return;
    }

    try {
        const dados = {
            ativo: ativo,
            diasDisponiveis: diasDisponiveis,
            horarioInicio: horarioInicio,
            horarioFim: horarioFim,
            intervaloSlots: intervaloSlots,
            duracaoSlot: duracaoSlot,
            emailSuporte: emailSuporte,
            atualizadoEm: firebase.firestore.FieldValue.serverTimestamp(),
            atualizadoPor: currentUser?.uid || 'sistema',
            atualizadoPorNome: currentUser?.nome || 'sistema'
        };

        await db.collection('configuracoes').doc(CONFIG_HORARIOS_DOC).set(dados, { merge: true });
        
        atualizarDisplayHorarios(dados);
        
        alert('✅ Configurações de horários salvas com sucesso!');
        
    } catch (error) {
        console.error("❌ Erro ao salvar configurações de horários:", error);
        alert('❌ Erro ao salvar: ' + error.message);
    }
}

async function restaurarConfiguracoesHorariosPadrao() {
    if (!confirm('⚠️ Deseja restaurar as configurações padrão de horários?')) {
        return;
    }

    try {
        await db.collection('configuracoes').doc(CONFIG_HORARIOS_DOC).set(HORARIOS_PADRAO);
        
        document.getElementById('configHorariosAtivo').checked = HORARIOS_PADRAO.ativo;
        document.getElementById('configHorarioInicio').value = HORARIOS_PADRAO.horarioInicio;
        document.getElementById('configHorarioFim').value = HORARIOS_PADRAO.horarioFim;
        document.getElementById('configIntervaloSlots').value = HORARIOS_PADRAO.intervaloSlots;
        document.getElementById('configDuracaoSlot').value = HORARIOS_PADRAO.duracaoSlot;
        document.getElementById('configEmailSuporte').value = HORARIOS_PADRAO.emailSuporte;
        
        document.querySelectorAll('.dias-disponiveis').forEach(cb => {
            cb.checked = HORARIOS_PADRAO.diasDisponiveis.includes(parseInt(cb.value));
        });
        
        atualizarDisplayHorarios(HORARIOS_PADRAO);
        
        alert('✅ Configurações restauradas para o padrão!');
        
    } catch (error) {
        console.error("❌ Erro ao restaurar configurações:", error);
        alert('❌ Erro ao restaurar: ' + error.message);
    }
}

async function getConfiguracoesHorarios() {
    try {
        const doc = await db.collection('configuracoes').doc(CONFIG_HORARIOS_DOC).get();
        
        if (doc.exists) {
            return doc.data();
        } else {
            return { ...HORARIOS_PADRAO };
        }
    } catch (error) {
        console.error("❌ Erro ao buscar configurações de horários:", error);
        return { ...HORARIOS_PADRAO };
    }
}

// ==================== FUNÇÃO GERAR SLOTS ====================
async function gerarSlotsHorarios(data) {
    try {
        const config = await getConfiguracoesHorarios();
        
        if (!config.ativo) {
            return { disponivel: false, slots: [], motivo: 'Sistema de agendamento desativado' };
        }
        
        const dataObj = new Date(data + 'T00:00:00');
        const diaSemana = dataObj.getDay();
        const diaNumero = diaSemana === 0 ? 7 : diaSemana;
        
        if (!config.diasDisponiveis.includes(diaNumero)) {
            const nomeDia = DIAS_SEMANA_COMPLETO[diaSemana];
            return { 
                disponivel: false, 
                slots: [], 
                motivo: `${nomeDia} não é um dia disponível para agendamento` 
            };
        }
        
        const inicio = config.horarioInicio || '08:00';
        const fim = config.horarioFim || '18:00';
        const intervalo = config.intervaloSlots || 60;
        const duracaoSlot = config.duracaoSlot || 60;
        
        const [horaInicio, minInicio] = inicio.split(':').map(Number);
        const [horaFim, minFim] = fim.split(':').map(Number);
        
        const slots = [];
        let horaAtual = horaInicio;
        let minAtual = minInicio;
        
        while (horaAtual < horaFim || (horaAtual === horaFim && minAtual < minFim)) {
            const horaStr = String(horaAtual).padStart(2, '0');
            const minStr = String(minAtual).padStart(2, '0');
            
            let minFimSlot = minAtual + duracaoSlot;
            let horaFimSlot = horaAtual;
            if (minFimSlot >= 60) {
                horaFimSlot += Math.floor(minFimSlot / 60);
                minFimSlot = minFimSlot % 60;
            }
            
            const fimTotalMin = horaFim * 60 + minFim;
            const inicioSlotMin = horaAtual * 60 + minAtual;
            const fimSlotMin = horaFimSlot * 60 + minFimSlot;
            
            if (fimSlotMin > fimTotalMin) {
                break;
            }
            
            const horaFimStr = String(horaFimSlot).padStart(2, '0');
            const minFimStr = String(minFimSlot).padStart(2, '0');
            
            slots.push({
                inicio: `${horaStr}:${minStr}`,
                fim: `${horaFimStr}:${minFimStr}`,
                inicioObj: new Date(0, 0, 0, horaAtual, minAtual),
                fimObj: new Date(0, 0, 0, horaFimSlot, minFimSlot),
                inicioMin: horaAtual * 60 + minAtual,
                fimMin: horaFimSlot * 60 + minFimSlot,
                duracaoPadrao: duracaoSlot
            });
            
            minAtual += intervalo;
            if (minAtual >= 60) {
                horaAtual += Math.floor(minAtual / 60);
                minAtual = minAtual % 60;
            }
        }
        
        const dataInicio = data + 'T00:00:00.000Z';
        const dataFim = data + 'T23:59:59.999Z';
        
        const eventosSnapshot = await db.collection('eventosAgenda')
            .where('data', '>=', dataInicio)
            .where('data', '<=', dataFim)
            .get();
        
        const eventosAgendados = [];
        eventosSnapshot.forEach(doc => {
            const evento = { id: doc.id, ...doc.data() };
            if (!evento.duracao) evento.duracao = 60;
            eventosAgendados.push(evento);
        });
        
        const bloqueios = bloqueiosCache.filter(b => b.data === data);
        const bloqueiosComDuracao = bloqueios.map(b => ({
            horario: b.horario,
            duracao: b.duracao || 60,
            motivo: b.motivo
        }));
        
        const slotsDisponiveis = slots.map(slot => {
            let eventoOcupante = null;
            const ocupado = eventosAgendados.some(e => {
                const eData = new Date(e.data);
                const eHora = eData.getHours();
                const eMin = eData.getMinutes();
                const eDuracao = e.duracao || 60;
                
                const eventoInicioMin = eHora * 60 + eMin;
                const eventoFimMin = eventoInicioMin + eDuracao;
                
                const haSobreposicao = (slot.inicioMin < eventoFimMin && slot.fimMin > eventoInicioMin);
                
                if (haSobreposicao) {
                    eventoOcupante = e;
                }
                
                return haSobreposicao;
            });
            
            let bloqueado = false;
            let bloqueioMotivo = null;
            
            for (const b of bloqueiosComDuracao) {
                const [horaBloq, minBloq] = b.horario.split(':').map(Number);
                const inicioBloqMin = horaBloq * 60 + minBloq;
                const fimBloqMin = inicioBloqMin + b.duracao;
                
                const haSobreposicao = (slot.inicioMin < fimBloqMin && slot.fimMin > inicioBloqMin);
                
                if (haSobreposicao) {
                    bloqueado = true;
                    bloqueioMotivo = b.motivo || 'Indisponível';
                    break;
                }
            }
            
            return {
                ...slot,
                disponivel: !ocupado && !bloqueado,
                ocupado: ocupado,
                eventoOcupante: eventoOcupante,
                bloqueado: bloqueado,
                bloqueadoMotivo: bloqueioMotivo
            };
        });
        
        return {
            disponivel: true,
            slots: slotsDisponiveis,
            config: {
                inicio,
                fim,
                intervalo,
                duracao: duracaoSlot,
                emailSuporte: config.emailSuporte
            }
        };
        
    } catch (error) {
        console.error("❌ Erro ao gerar slots de horários:", error);
        return { disponivel: false, slots: [], motivo: 'Erro ao gerar horários' };
    }
}

// ==================== FUNÇÃO PARA VALIDAR HORÁRIO DISPONÍVEL ====================
async function validarHorarioDisponivel(data, horario, duracao, eventoId = null) {
    const conflitos = await verificarTodosConflitos(data, horario, duracao, eventoId);
    
    return {
        disponivel: !conflitos.temConflito,
        conflitos: conflitos,
        mensagem: conflitos.temConflito ? conflitos.mensagem : 'Horário disponível'
    };
}

// ==================== FUNÇÃO PARA OBTER HORÁRIOS OCUPADOS DO DIA ====================
async function getHorariosOcupados(data) {
    try {
        const dataInicio = data + 'T00:00:00.000Z';
        const dataFim = data + 'T23:59:59.999Z';
        
        const snapshot = await db.collection('eventosAgenda')
            .where('data', '>=', dataInicio)
            .where('data', '<=', dataFim)
            .get();
        
        const ocupados = [];
        snapshot.forEach(doc => {
            const e = { id: doc.id, ...doc.data() };
            const eData = new Date(e.data);
            const eHora = eData.getHours();
            const eMin = eData.getMinutes();
            const eDuracao = e.duracao || 60;
            
            ocupados.push({
                inicio: `${String(eHora).padStart(2, '0')}:${String(eMin).padStart(2, '0')}`,
                duracao: eDuracao,
                titulo: e.titulo,
                responsavel: e.responsavelNome
            });
        });
        
        return ocupados;
    } catch (error) {
        console.error("❌ Erro ao buscar horários ocupados:", error);
        return [];
    }
}

// ==================== FUNÇÃO PARA BLOQUEAR HORÁRIOS AUTOMATICAMENTE ====================
async function bloquearHorariosAutomaticamente(data, horario, duracao, titulo) {
    try {
        let config = { ...HORARIOS_PADRAO };
        try {
            const doc = await db.collection('configuracoes').doc('configuracoesHorarios').get();
            if (doc.exists) {
                config = { ...HORARIOS_PADRAO, ...doc.data() };
            }
        } catch (e) {
            console.warn("⚠️ Usando configurações padrão:", e.message);
        }

        if (!config.ativo) {
            console.log("ℹ️ Sistema de horários desativado. Pulando bloqueio automático.");
            return;
        }

        const [horaEvento, minEvento] = horario.split(':').map(Number);
        const inicioEventoMin = horaEvento * 60 + minEvento;
        const fimEventoMin = inicioEventoMin + duracao;

        console.log(`🔍 Bloqueio automático: ${horario} - ${addMinutes(horario, duracao)} (${duracao}min) - ${titulo || 'Evento'}`);

        const inicio = config.horarioInicio || '08:00';
        const fim = config.horarioFim || '18:00';
        const intervalo = config.intervaloSlots || 60;
        const duracaoSlot = config.duracaoSlot || 60;

        const [horaInicio, minInicio] = inicio.split(':').map(Number);
        const [horaFim, minFim] = fim.split(':').map(Number);

        const slotsOcupados = [];
        let horaAtual = horaInicio;
        let minAtual = minInicio;

        while (horaAtual < horaFim || (horaAtual === horaFim && minAtual < minFim)) {
            const inicioSlotMin = horaAtual * 60 + minAtual;
            let minFimSlot = minAtual + duracaoSlot;
            let horaFimSlot = horaAtual;
            if (minFimSlot >= 60) {
                horaFimSlot += Math.floor(minFimSlot / 60);
                minFimSlot = minFimSlot % 60;
            }
            const fimSlotMin = horaFimSlot * 60 + minFimSlot;

            const haSobreposicao = (inicioEventoMin < fimSlotMin && fimEventoMin > inicioSlotMin);
            
            if (haSobreposicao) {
                const horaStr = String(horaAtual).padStart(2, '0');
                const minStr = String(minAtual).padStart(2, '0');
                const horaFimStr = String(horaFimSlot).padStart(2, '0');
                const minFimStr = String(minFimSlot).padStart(2, '0');
                
                slotsOcupados.push({
                    inicio: `${horaStr}:${minStr}`,
                    fim: `${horaFimStr}:${minFimStr}`,
                    inicioMin: inicioSlotMin,
                    fimMin: fimSlotMin
                });
                console.log(`🔒 Slot ${horaStr}:${minStr} - ${horaFimStr}:${minFimStr} será bloqueado`);
            }

            minAtual += intervalo;
            if (minAtual >= 60) {
                horaAtual += Math.floor(minAtual / 60);
                minAtual = minAtual % 60;
            }
        }

        const bloqueiosExistentes = bloqueiosCache.filter(b => b.data === data);
        
        let novosBloqueios = 0;
        for (const slot of slotsOcupados) {
            const existe = bloqueiosExistentes.some(b => {
                const [horaBloq, minBloq] = b.horario.split(':').map(Number);
                const inicioBloqMin = horaBloq * 60 + minBloq;
                const fimBloqMin = inicioBloqMin + (b.duracao || 60);
                return (slot.inicioMin >= inicioBloqMin && slot.fimMin <= fimBloqMin);
            });

            if (!existe) {
                const novoBloqueio = {
                    id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 5),
                    data: data,
                    horario: slot.inicio,
                    duracao: duracaoSlot,
                    motivo: `Evento: ${titulo || 'Agendado'} - ${duracao}min`,
                    criadoEm: new Date().toISOString(),
                    criadoPor: currentUser?.uid || 'sistema',
                    criadoPorNome: currentUser?.nome || 'sistema',
                    automatico: true
                };
                
                bloqueiosCache.push(novoBloqueio);
                novosBloqueios++;
                console.log(`✅ Bloqueio automático adicionado: ${slot.inicio} - ${slot.fim}`);
            } else {
                console.log(`ℹ️ Slot ${slot.inicio} - ${slot.fim} já está bloqueado`);
            }
        }

        if (novosBloqueios > 0) {
            await db.collection('configuracoes').doc(CONFIG_BLOQUEIOS_DOC).set({
                bloqueios: bloqueiosCache,
                atualizadoEm: firebase.firestore.FieldValue.serverTimestamp(),
                atualizadoPor: currentUser?.uid || 'sistema',
                atualizadoPorNome: currentUser?.nome || 'sistema'
            });
            console.log(`✅ ${novosBloqueios} bloqueios automáticos salvos com sucesso!`);
        }

        return slotsOcupados;

    } catch (error) {
        console.error("❌ Erro ao bloquear horários automaticamente:", error);
        return [];
    }
}

// ==================== FUNÇÃO PARA REMOVER BLOQUEIOS AUTOMÁTICOS ====================
async function removerBloqueiosAutomaticos(eventoId) {
    if (!eventoId) {
        console.warn("⚠️ ID do evento não fornecido para remover bloqueios");
        return;
    }
    
    try {
        const doc = await db.collection('eventosAgenda').doc(eventoId).get();
        if (!doc.exists) {
            console.warn(`⚠️ Evento ${eventoId} não encontrado para remover bloqueios`);
            return;
        }

        const evento = doc.data();
        const data = extrairDataISO(evento.data);
        const eData = new Date(evento.data);
        const horario = String(eData.getHours()).padStart(2, '0') + ':' + String(eData.getMinutes()).padStart(2, '0');
        const duracao = evento.duracao || 60;

        console.log(`🔍 Removendo bloqueios automáticos: ${data} - ${horario} (${duracao}min)`);

        const bloqueiosRemover = bloqueiosCache.filter(b => 
            b.data === data && 
            b.automatico === true &&
            b.horario === horario
        );

        if (bloqueiosRemover.length === 0) {
            console.log(`ℹ️ Nenhum bloqueio automático encontrado para o evento ${eventoId}`);
            return;
        }

        bloqueiosCache = bloqueiosCache.filter(b => 
            !(b.data === data && b.automatico === true && b.horario === horario)
        );

        await db.collection('configuracoes').doc(CONFIG_BLOQUEIOS_DOC).set({
            bloqueios: bloqueiosCache,
            atualizadoEm: firebase.firestore.FieldValue.serverTimestamp(),
            atualizadoPor: currentUser?.uid || 'sistema',
            atualizadoPorNome: currentUser?.nome || 'sistema'
        });

        console.log(`✅ ${bloqueiosRemover.length} bloqueios automáticos removidos para o evento ${eventoId}`);
        
        atualizarListaBloqueios();
        atualizarContadorBloqueios();

    } catch (error) {
        console.error("❌ Erro ao remover bloqueios automáticos:", error);
    }
}

async function visualizarHorariosDisponiveis() {
    const data = new Date();
    const dataStr = data.toISOString().split('T')[0];
    
    try {
        const result = await gerarSlotsHorarios(dataStr);
        
        if (!result.disponivel) {
            alert(`📅 ${result.motivo}`);
            return;
        }
        
        const slotsDisponiveis = result.slots.filter(s => s.disponivel);
        const slotsOcupados = result.slots.filter(s => s.ocupado);
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.cssText = `
            display: flex !important;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            backdrop-filter: blur(4px);
            animation: fadeIn 0.3s ease;
        `;
        
        modal.innerHTML = `
            <div style="
                background: white;
                border-radius: 20px;
                padding: 32px;
                max-width: 600px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 25px 50px -12px rgba(0,0,0,0.3);
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <h3 style="margin: 0; color: #0f172a;">
                        <i class="fas fa-clock" style="color: #10b981;"></i>
                        Horários Disponíveis - ${formatarDataParaExibicao(dataStr)}
                    </h3>
                    <button onclick="this.closest('.modal').remove()" style="
                        background: none;
                        border: none;
                        font-size: 24px;
                        cursor: pointer;
                        color: #94a3b8;
                    ">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div style="margin-bottom: 16px; padding: 12px; background: #f0f7ff; border-radius: 10px; font-size: 13px; color: #1e293b;">
                    <i class="fas fa-info-circle" style="color: #2563eb;"></i>
                    ${result.config.inicio} - ${result.config.fim} | Intervalo: ${result.config.intervalo}min | Duração: ${result.config.duracao}min
                </div>
                
                ${slotsDisponiveis.length > 0 ? `
                    <div style="margin-bottom: 16px;">
                        <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #10b981;">
                            ✅ Slots Disponíveis (${slotsDisponiveis.length})
                        </h4>
                        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                            ${slotsDisponiveis.map(s => `
                                <span style="
                                    padding: 6px 14px;
                                    background: #d1fae5;
                                    color: #059669;
                                    border-radius: 20px;
                                    font-size: 13px;
                                    font-weight: 500;
                                ">
                                    ${s.inicio} - ${s.fim}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                ` : `
                    <div style="margin-bottom: 16px; padding: 12px; background: #fef3c7; border-radius: 10px; color: #d97706;">
                        <i class="fas fa-exclamation-triangle"></i>
                        Nenhum horário disponível para hoje.
                    </div>
                `}
                
                ${slotsOcupados.length > 0 ? `
                    <div style="margin-bottom: 16px;">
                        <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #ef4444;">
                            ❌ Slots Ocupados (${slotsOcupados.length})
                        </h4>
                        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                            ${slotsOcupados.map(s => `
                                <span style="
                                    padding: 6px 14px;
                                    background: #fee2e2;
                                    color: #dc2626;
                                    border-radius: 20px;
                                    font-size: 13px;
                                    font-weight: 500;
                                ">
                                    ${s.inicio} - ${s.fim}
                                    ${s.eventoOcupante ? ` (${s.eventoOcupante.titulo})` : ''}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <div style="margin-top: 16px; padding: 12px; background: #f1f5f9; border-radius: 10px; font-size: 12px; color: #64748b;">
                    <i class="fas fa-envelope"></i>
                    Para solicitar um horário, envie um e-mail para:
                    <strong>${result.config.emailSuporte}</strong>
                </div>
                
                <button onclick="this.closest('.modal').remove()" style="
                    width: 100%;
                    margin-top: 16px;
                    padding: 12px;
                    border-radius: 12px;
                    border: none;
                    background: #2563eb;
                    color: white;
                    font-weight: 600;
                    cursor: pointer;
                    font-family: inherit;
                ">
                    <i class="fas fa-check"></i> Fechar
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.remove();
            }
        });
        
    } catch (error) {
        console.error("❌ Erro ao visualizar horários:", error);
        alert('Erro ao carregar horários: ' + error.message);
    }
}

// ==================== GESTÃO DE BLOQUEIOS DE HORÁRIOS ====================

const CONFIG_BLOQUEIOS_DOC = 'bloqueiosHorarios';
let bloqueiosCache = [];

// ==================== FUNÇÃO PARA VERIFICAR CONFLITO COM BLOQUEIOS ====================
async function verificarConflitoComBloqueios(data, horario, duracao = 60) {
    if (!data || !horario) {
        return { temConflito: false, bloqueios: [] };
    }

    try {
        const bloqueiosDoDia = bloqueiosCache.filter(b => b.data === data);
        
        if (bloqueiosDoDia.length === 0) {
            return { temConflito: false, bloqueios: [] };
        }

        const [horaEvento, minEvento] = horario.split(':').map(Number);
        const inicioEventoMin = horaEvento * 60 + minEvento;
        const fimEventoMin = inicioEventoMin + duracao;

        const conflitos = bloqueiosDoDia.filter(b => {
            const [horaBloqueio, minBloqueio] = b.horario.split(':').map(Number);
            const inicioBloqueioMin = horaBloqueio * 60 + minBloqueio;
            const duracaoBloqueio = b.duracao || 60;
            const fimBloqueioMin = inicioBloqueioMin + duracaoBloqueio;

            return (inicioEventoMin < fimBloqueioMin && fimEventoMin > inicioBloqueioMin);
        });

        return {
            temConflito: conflitos.length > 0,
            bloqueios: conflitos
        };

    } catch (error) {
        console.error("❌ Erro ao verificar conflito com bloqueios:", error);
        return { temConflito: false, bloqueios: [] };
    }
}

// ==================== VERIFICAR CONFLITO COM EVENTOS EXISTENTES ====================
async function verificarConflitoComEventos(data, horario, duracao = 60, eventoId = null) {
    if (!data || !horario) {
        return { temConflito: false, eventos: [] };
    }

    try {
        const dataInicio = data + 'T00:00:00.000Z';
        const dataFim = data + 'T23:59:59.999Z';

        const snapshot = await db.collection('eventosAgenda')
            .where('data', '>=', dataInicio)
            .where('data', '<=', dataFim)
            .get();

        const eventos = [];
        snapshot.forEach(doc => {
            if (doc.id === eventoId) return;
            const e = { id: doc.id, ...doc.data() };
            if (!e.duracao) e.duracao = 60;
            eventos.push(e);
        });

        const [horaEvento, minEvento] = horario.split(':').map(Number);
        const inicioEventoMin = horaEvento * 60 + minEvento;
        const fimEventoMin = inicioEventoMin + duracao;

        const conflitos = eventos.filter(e => {
            const eData = new Date(e.data);
            const eHora = eData.getHours();
            const eMin = eData.getMinutes();
            const eDuracao = e.duracao || 60;

            const inicioExistenteMin = eHora * 60 + eMin;
            const fimExistenteMin = inicioExistenteMin + eDuracao;

            return (inicioEventoMin < fimExistenteMin && fimEventoMin > inicioExistenteMin);
        });

        return {
            temConflito: conflitos.length > 0,
            eventos: conflitos
        };

    } catch (error) {
        console.error("❌ Erro ao verificar conflito com eventos:", error);
        return { temConflito: false, eventos: [] };
    }
}

// ==================== VERIFICAR TODOS OS CONFLITOS ====================
async function verificarTodosConflitos(data, horario, duracao = 60, eventoId = null) {
    const resultados = {
        temConflito: false,
        bloqueios: [],
        eventos: [],
        mensagem: ''
    };

    const conflitoBloqueios = await verificarConflitoComBloqueios(data, horario, duracao);
    if (conflitoBloqueios.temConflito) {
        resultados.temConflito = true;
        resultados.bloqueios = conflitoBloqueios.bloqueios;
        resultados.mensagem += `🔒 Este horário está bloqueado (${conflitoBloqueios.bloqueios.map(b => b.horario).join(', ')}). `;
    }

    const conflitoEventos = await verificarConflitoComEventos(data, horario, duracao, eventoId);
    if (conflitoEventos.temConflito) {
        resultados.temConflito = true;
        resultados.eventos = conflitoEventos.eventos;
        resultados.mensagem += `📋 Conflito com ${conflitoEventos.eventos.length} evento(s) existente(s). `;
    }

    return resultados;
}

async function carregarBloqueiosHorarios() {
    try {
        const doc = await db.collection('configuracoes').doc(CONFIG_BLOQUEIOS_DOC).get();
        
        if (doc.exists) {
            bloqueiosCache = doc.data().bloqueios || [];
        } else {
            bloqueiosCache = [];
        }
        
        atualizarListaBloqueios();
        atualizarContadorBloqueios();
        
        console.log("✅ Bloqueios de horários carregados:", bloqueiosCache.length);
        
        const dataInput = document.getElementById('bloqueioData');
        if (dataInput) {
            if (!dataInput.value) {
                const hoje = new Date();
                const dataStr = hoje.toISOString().split('T')[0];
                dataInput.value = dataStr;
            }
            await atualizarSelectBloqueioHorarios();
        }
        
    } catch (error) {
        console.error("❌ Erro ao carregar bloqueios:", error);
        bloqueiosCache = [];
    }
}

// ==================== LISTENER DE BLOQUEIOS EM TEMPO REAL ====================
function iniciarListenerBloqueios() {
    if (unsubscribeBloqueios) {
        unsubscribeBloqueios();
    }

    try {
        unsubscribeBloqueios = db.collection('configuracoes').doc('bloqueiosHorarios')
            .onSnapshot((doc) => {
                if (doc.exists) {
                    bloqueiosCache = doc.data().bloqueios || [];
                    console.log("🔄 Bloqueios atualizados em tempo real:", bloqueiosCache.length);
                    
                    atualizarListaBloqueios();
                    atualizarContadorBloqueios();
                    
                    const select = document.getElementById('bloqueioHorario');
                    if (select && select.options.length > 0) {
                        atualizarSelectBloqueioHorarios();
                    }
                }
            }, (error) => {
                console.error("❌ Erro no listener de bloqueios:", error);
            });
    } catch (error) {
        console.error("❌ Erro ao iniciar listener de bloqueios:", error);
    }
}

function atualizarContadorBloqueios() {
    const el = document.getElementById('displayTotalBloqueios');
    if (el) {
        el.textContent = bloqueiosCache.length;
        el.style.color = bloqueiosCache.length > 0 ? '#ef4444' : '#10b981';
    }
}

function atualizarListaBloqueios() {
    const container = document.getElementById('listaBloqueios');
    if (!container) return;
    
    if (bloqueiosCache.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; color: #94a3b8; font-size: 13px; padding: 8px;">
                Nenhum horário bloqueado.
            </div>
        `;
        return;
    }
    
    const bloqueiosOrdenados = [...bloqueiosCache].sort((a, b) => {
        if (a.data < b.data) return -1;
        if (a.data > b.data) return 1;
        return (a.horario || '').localeCompare(b.horario || '');
    });
    
    container.innerHTML = '';
    bloqueiosOrdenados.forEach(b => {
        const dataStr = formatarDataParaExibicaoSimples(b.data);
        const duracao = b.duracao || 60;
        const horarioFim = addMinutes(b.horario, duracao);
        
        const item = document.createElement('div');
        item.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 6px 10px;
            background: white;
            border-radius: 6px;
            margin-bottom: 4px;
            border-left: 3px solid #ef4444;
            font-size: 13px;
        `;
        item.innerHTML = `
            <span>
                <i class="fas fa-calendar-day" style="color: #64748b;"></i>
                ${dataStr} - <strong>${b.horario} às ${horarioFim}</strong>
                (${duracao}min)
                ${b.motivo ? ` - ${b.motivo}` : ''}
                ${b.automatico ? ' 🔄 (Automático)' : ''}
            </span>
            <button onclick="desbloquearHorario('${b.id}')" style="
                background: none;
                border: none;
                color: #ef4444;
                cursor: pointer;
                font-size: 14px;
                padding: 0 4px;
            ">
                <i class="fas fa-times"></i>
            </button>
        `;
        container.appendChild(item);
    });
    
    atualizarContadorBloqueios();
}

async function atualizarSelectBloqueioHorarios() {
    const select = document.getElementById('bloqueioHorario');
    const dataInput = document.getElementById('bloqueioData');
    
    if (!select || !dataInput) {
        console.warn("⚠️ Elementos de bloqueio não encontrados");
        return;
    }
    
    const data = dataInput.value;
    
    if (!data) {
        select.innerHTML = '<option value="">Selecione uma data primeiro...</option>';
        return;
    }
    
    try {
        console.log("🔄 Buscando horários para data:", data);
        
        const result = await gerarSlotsHorarios(data);
        
        select.innerHTML = '<option value="">Selecione um horário...</option>';
        
        if (!result.disponivel || result.slots.length === 0) {
            select.innerHTML = `<option value="">${result.motivo || 'Nenhum horário disponível para esta data'}</option>`;
            return;
        }
        
        const bloqueios = bloqueiosCache.filter(b => b.data === data);
        
        result.slots.forEach(slot => {
            const option = document.createElement('option');
            option.value = slot.inicio;
            
            const estaBloqueado = bloqueios.some(b => {
                const [horaBloq, minBloq] = b.horario.split(':').map(Number);
                const [horaSlot, minSlot] = slot.inicio.split(':').map(Number);
                const inicioBloq = horaBloq * 60 + minBloq;
                const fimBloq = inicioBloq + (b.duracao || 60);
                const inicioSlot = horaSlot * 60 + minSlot;
                const fimSlot = inicioSlot + 60;
                return (inicioSlot < fimBloq && fimSlot > inicioBloq);
            });
            
            const estaOcupado = slot.ocupado === true;
            
            let label = `${slot.inicio} - ${slot.fim}`;
            if (estaBloqueado) {
                const bloqueio = bloqueios.find(b => {
                    const [horaBloq, minBloq] = b.horario.split(':').map(Number);
                    const [horaSlot, minSlot] = slot.inicio.split(':').map(Number);
                    const inicioBloq = horaBloq * 60 + minBloq;
                    const fimBloq = inicioBloq + (b.duracao || 60);
                    const inicioSlot = horaSlot * 60 + minSlot;
                    const fimSlot = inicioSlot + 60;
                    return (inicioSlot < fimBloq && fimSlot > inicioBloq);
                });
                label += ` 🔒 (Bloqueado${bloqueio?.duracao ? ` ${bloqueio.duracao}min` : ''})`;
                option.disabled = true;
                option.style.color = '#94a3b8';
            } else if (estaOcupado) {
                label += ' 📋 (Ocupado)';
                option.style.color = '#f59e0b';
                option.style.fontWeight = '500';
            }
            
            option.textContent = label;
            select.appendChild(option);
        });
        
        console.log(`✅ ${result.slots.length} horários carregados para ${data}`);
        
    } catch (error) {
        console.error("❌ Erro ao carregar horários:", error);
        select.innerHTML = `<option value="">Erro ao carregar horários: ${error.message}</option>`;
    }
}

async function bloquearHorario() {
    const data = document.getElementById('bloqueioData').value;
    const horario = document.getElementById('bloqueioHorario').value;
    const motivo = prompt('Motivo do bloqueio (opcional):');
    
    const duracaoInput = prompt('Duração do bloqueio em minutos (padrão 60):', '60');
    const duracao = parseInt(duracaoInput) || 60;
    
    if (duracao < 15 || duracao > 480) {
        alert('❌ A duração do bloqueio deve ser entre 15 e 480 minutos.');
        return;
    }
    
    if (!data) {
        alert('❌ Selecione uma data para bloquear.');
        return;
    }
    
    if (!horario) {
        alert('❌ Selecione um horário para bloquear.');
        return;
    }
    
    const conflito = bloqueiosCache.some(b => {
        if (b.data !== data) return false;
        const [horaExistente, minExistente] = b.horario.split(':').map(Number);
        const [horaNovo, minNovo] = horario.split(':').map(Number);
        const inicioExistente = horaExistente * 60 + minExistente;
        const fimExistente = inicioExistente + (b.duracao || 60);
        const inicioNovo = horaNovo * 60 + minNovo;
        const fimNovo = inicioNovo + duracao;
        return (inicioNovo < fimExistente && fimNovo > inicioExistente);
    });
    
    if (conflito) {
        alert('⚠️ Este período já possui um bloqueio. Verifique a lista de bloqueios.');
        return;
    }
    
    try {
        const result = await gerarSlotsHorarios(data);
        const slot = result.slots?.find(s => s.inicio === horario);
        if (slot && slot.ocupado) {
            if (!confirm(`⚠️ Este horário está ocupado por um evento agendado. Deseja bloqueá-lo mesmo assim?`)) {
                return;
            }
        }
    } catch (e) {
        // Ignora erro na verificação
    }
    
    try {
        const novoBloqueio = {
            id: Date.now().toString(),
            data: data,
            horario: horario,
            duracao: duracao,
            motivo: motivo || 'Indisponível',
            criadoEm: new Date().toISOString(),
            criadoPor: currentUser?.uid || 'sistema',
            criadoPorNome: currentUser?.nome || 'sistema',
            automatico: false
        };
        
        bloqueiosCache.push(novoBloqueio);
        
        await db.collection('configuracoes').doc(CONFIG_BLOQUEIOS_DOC).set({
            bloqueios: bloqueiosCache,
            atualizadoEm: firebase.firestore.FieldValue.serverTimestamp(),
            atualizadoPor: currentUser?.uid || 'sistema',
            atualizadoPorNome: currentUser?.nome || 'sistema'
        });
        
        atualizarListaBloqueios();
        await atualizarSelectBloqueioHorarios();
        atualizarContadorBloqueios();
        
        alert('✅ Horário bloqueado com sucesso!');
        
    } catch (error) {
        console.error("❌ Erro ao bloquear horário:", error);
        alert('❌ Erro ao bloquear: ' + error.message);
    }
}

async function desbloquearHorario(id) {
    if (!confirm('Deseja desbloquear este horário?')) {
        return;
    }
    
    try {
        bloqueiosCache = bloqueiosCache.filter(b => b.id !== id);
        
        await db.collection('configuracoes').doc(CONFIG_BLOQUEIOS_DOC).set({
            bloqueios: bloqueiosCache,
            atualizadoEm: firebase.firestore.FieldValue.serverTimestamp(),
            atualizadoPor: currentUser?.uid || 'sistema',
            atualizadoPorNome: currentUser?.nome || 'sistema'
        });
        
        atualizarListaBloqueios();
        await atualizarSelectBloqueioHorarios();
        atualizarContadorBloqueios();
        
        alert('✅ Horário desbloqueado com sucesso!');
        
    } catch (error) {
        console.error("❌ Erro ao desbloquear horário:", error);
        alert('❌ Erro ao desbloquear: ' + error.message);
    }
}

async function limparBloqueiosData() {
    const data = document.getElementById('bloqueioData').value;
    
    if (!data) {
        alert('❌ Selecione uma data para limpar os bloqueios.');
        return;
    }
    
    const qtd = bloqueiosCache.filter(b => b.data === data).length;
    
    if (qtd === 0) {
        alert('ℹ️ Não há bloqueios para esta data.');
        return;
    }
    
    if (!confirm(`Deseja remover todos os ${qtd} bloqueios do dia ${formatarDataParaExibicaoSimples(data)}?`)) {
        return;
    }
    
    try {
        bloqueiosCache = bloqueiosCache.filter(b => b.data !== data);
        
        await db.collection('configuracoes').doc(CONFIG_BLOQUEIOS_DOC).set({
            bloqueios: bloqueiosCache,
            atualizadoEm: firebase.firestore.FieldValue.serverTimestamp(),
            atualizadoPor: currentUser?.uid || 'sistema',
            atualizadoPorNome: currentUser?.nome || 'sistema'
        });
        
        atualizarListaBloqueios();
        await atualizarSelectBloqueioHorarios();
        atualizarContadorBloqueios();
        
        alert(`✅ ${qtd} bloqueios removidos com sucesso!`);
        
    } catch (error) {
        console.error("❌ Erro ao limpar bloqueios:", error);
        alert('❌ Erro ao limpar: ' + error.message);
    }
}

// ==================== CONTROLE DE LIMITE DE EVENTOS POR COLABORADOR ====================

async function verificarDemandaColaborador(colaboradorId, data, duracao = 60) {
    // ... (mesmo código existente)
}

function exibirAlertaDemanda(demanda, colaboradorNome) {
    // ... (mesmo código existente)
}

async function verificarDemandaAntesDeSalvar(colaboradorId, colaboradorNome, data, duracao = 60) {
    // ... (mesmo código existente)
}

async function exibirRelatorioDemanda(colaboradorId) {
    // ... (mesmo código existente)
}

// ==================== ADICIONAR EVENTO ====================
async function adicionarEvento() {
    // ... (mesmo código existente)
}

// ==================== EDIÇÃO DE EVENTOS ====================
function editarEvento(id) {
    // ... (mesmo código existente)
}

async function salvarEdicao(id) {
    // ... (mesmo código existente)
}

function excluirEvento(id) {
    // ... (mesmo código existente)
}

async function excluirEventoConfirmado() {
    // ... (mesmo código existente)
}

function fecharEdicao() {
    // ... (mesmo código existente)
}

// ==================== CONFIGURAÇÕES ====================
async function salvarConfiguracoes() {
    // ... (mesmo código existente)
}

// ==================== SIDEBAR ====================
function iniciarSidebar() {
    const sidebarItems = document.querySelectorAll('.sidebar li');
    sidebarItems.forEach(item => {
        item.removeEventListener('click', sidebarClickHandler);
        item.addEventListener('click', sidebarClickHandler);
    });
    
    console.log("✅ Sidebar inicializada com " + sidebarItems.length + " itens");
}

function sidebarClickHandler() {
    document.querySelectorAll('.sidebar li').forEach(li => {
        li.classList.remove('active');
    });
    
    this.classList.add('active');
    
    const sectionId = this.dataset.section + 'Section';
    
    document.querySelectorAll('.section').forEach(sec => {
        sec.classList.remove('active');
        sec.style.display = 'none';
    });
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.style.display = 'block';
        
        if (sectionId === 'dashboardSection') {
            renderizarDashboard();
        }
        if (sectionId === 'reservasSection') {
            atualizarListaReservas();
            atualizarStatsReservas();
        }
        if (sectionId === 'solicitacoesSection') {
            if (typeof carregarSolicitacoesPendentes === 'function') {
                carregarSolicitacoesPendentes();
            }
        }
        if (sectionId === 'listarSection') {
            const hoje = new Date();
            const dataHoje = hoje.toISOString().split('T')[0];
            document.getElementById('filtroData').value = dataHoje;
            aplicarFiltrosCompletos();
        }
        
        console.log(`✅ Seção ativada: ${sectionId}`);
    } else {
        console.warn(`⚠️ Seção não encontrada: ${sectionId}`);
    }
}

// ==================== DASHBOARD ====================
function atualizarDashboard(snapshot) {
    // ... (mesmo código existente)
}

function filtrarEventosPorPeriodo(eventos) {
    // ... (mesmo código existente)
}

function atualizarDashboardStats(eventos) {
    // ... (mesmo código existente)
}

function atualizarProximosEventos(eventos) {
    // ... (mesmo código existente)
}

function atualizarGraficoTipos(eventos) {
    // ... (mesmo código existente)
}

function iniciarDashboard() {
    // ... (mesmo código existente)
}

function renderizarDashboard() {
    // ... (mesmo código existente)
}

// ==================== FILTROS POR PERÍODO ====================
function filtrarPorPeriodo(periodo) {
    // ... (mesmo código existente)
}

// ==================== FUNÇÕES AUXILIARES ====================
function formatarDataParaExibicao(dataISO) {
    // ... (mesmo código existente)
}

function formatarDataParaExibicaoSimples(data) {
    // ... (mesmo código existente)
}

function extrairHoraParaExibicao(dataISO) {
    // ... (mesmo código existente)
}

// ==================== CORRIGIR DATAS ====================
async function corrigirDatasEventos() {
    // ... (mesmo código existente)
}

// ==================== FUNÇÕES DE NAVEGAÇÃO DE DATA ====================
function buscarEventosPorData(data) {
    // ... (mesmo código existente)
}

function navegarData(direcao) {
    // ... (mesmo código existente)
}

function irParaHoje() {
    // ... (mesmo código existente)
}

function atualizarDataExibicao(data) {
    // ... (mesmo código existente)
}

// ==================== RESERVAS DE SALAS ====================

function iniciarListenerReservas() {
    if (unsubscribeReservas) {
        unsubscribeReservas();
    }

    try {
        const hoje = new Date();
        const dataHoje = hoje.toISOString().split('T')[0];

        unsubscribeReservas = db.collection('reservasSalas')
            .where('data', '==', dataHoje)
            .orderBy('data', 'asc')
            .onSnapshot((snapshot) => {
                console.log("🔄 Reservas atualizadas em tempo real!");
                reservasCache = [];
                snapshot.forEach(doc => {
                    reservasCache.push({ id: doc.id, ...doc.data() });
                });
                atualizarListaReservas();
                atualizarStatsReservas();
            }, (error) => {
                console.error("Erro no listener de reservas:", error);
            });
    } catch (error) {
        console.error("❌ Erro ao iniciar listener de reservas:", error);
    }
}

function atualizarListaReservas() {
    const container = document.getElementById('listaReservas');
    if (!container) return;

    let reservasFiltradas = [...reservasCache];

    if (filtroReservaDataAtual) {
        reservasFiltradas = reservasFiltradas.filter(r => r.data === filtroReservaDataAtual);
    }
    if (filtroReservaSalaAtual) {
        reservasFiltradas = reservasFiltradas.filter(r => r.sala === filtroReservaSalaAtual);
    }
    if (filtroReservaStatusAtual) {
        reservasFiltradas = reservasFiltradas.filter(r => r.status === filtroReservaStatusAtual);
    }

    reservasFiltradas.sort((a, b) => {
        if (a.data < b.data) return -1;
        if (a.data > b.data) return 1;
        return (a.horario || '').localeCompare(b.horario || '');
    });

    if (reservasFiltradas.length === 0) {
        container.innerHTML = `
            <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                <i class="fas fa-door-open" style="font-size: 48px; color: #cbd5e1;"></i>
                <h3 style="margin-top: 12px; color: #475569;">Nenhuma reserva encontrada</h3>
                <p style="color: #94a3b8;">Ajuste os filtros ou faça uma nova reserva de sala.</p>
                <div style="display: flex; justify-content: center; margin-top: 16px;">
                    <button onclick="abrirModalReserva()" class="btn-primary" style="width: auto; padding: 12px 40px; min-width: 200px; display: inline-flex; align-items: center; justify-content: center; gap: 8px;">
                        <i class="fas fa-plus"></i> Nova Reserva
                    </button>
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    reservasFiltradas.forEach(r => {
        const dataStr = formatarDataParaExibicao(r.data);
        const horaStr = r.horario || '--:--';
        const statusLabel = RESERVA_STATUS_LABELS[r.status] || r.status;
        const statusColor = RESERVA_STATUS_COLORS[r.status] || '#f1f5f9';
        const statusTextColor = RESERVA_STATUS_TEXT_COLORS[r.status] || '#1e293b';

        const salaLabel = SALAS_LABELS[r.sala] || r.sala;
        const capacidade = r.capacidade || SALAS_CAPACIDADE[r.sala] || 'N/A';

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const dataReserva = new Date(r.data + 'T00:00:00');
        const isPassado = dataReserva < hoje;

        const temConflito = verificarConflitoReserva(r);

        const card = document.createElement('div');
        card.className = 'card';
        card.id = `card-reserva-${r.id}`;
        card.style.borderLeft = `4px solid ${isPassado && r.status !== 'cancelada' ? '#94a3b8' : '#2563eb'}`;

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap; gap: 8px; margin-bottom: 8px;">
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <span class="status-badge" style="background: ${statusColor}; color: ${statusTextColor}; font-weight: 600;">
                        ${statusLabel}
                    </span>
                    ${temConflito ? `<span class="status-badge" style="background: #fee2e2; color: #dc2626; font-weight: 600;">
                        ⚠️ Conflito
                    </span>` : ''}
                    ${isPassado && r.status !== 'cancelada' ? `<span class="status-badge" style="background: #e2e8f0; color: #64748b; font-weight: 600;">
                        📅 Passado
                    </span>` : ''}
                </div>
                <span class="status-badge" style="background: #f1f5f9; color: #475569;">
                    ${salaLabel}
                </span>
            </div>

            <div style="margin: 8px 0; display: flex; gap: 16px; font-size: 14px; color: #64748b; flex-wrap: wrap;">
                <span><i class="fas fa-calendar-day" style="color: #2563eb;"></i> ${dataStr}</span>
                <span><i class="fas fa-clock" style="color: #2563eb;"></i> ${horaStr}</span>
                <span><i class="fas fa-hourglass-half" style="color: #2563eb;"></i> ${r.duracao || 60} min</span>
                <span><i class="fas fa-users" style="color: #2563eb;"></i> ${capacidade} pessoas</span>
            </div>

            <h3 style="margin: 6px 0; font-size: 18px;">${r.titulo}</h3>

            <div style="margin: 6px 0; padding: 8px 12px; background: #f0f7ff; border-radius: 8px; border-left: 3px solid #2563eb;">
                <p style="font-size: 14px; font-weight: 500; color: #1e293b;">
                    <i class="fas fa-user-tie" style="color: #2563eb;"></i> 
                    ${r.responsavelNome || 'Não definido'}
                </p>
                ${r.responsavelEmail ? `<p style="font-size: 12px; color: #64748b; margin-top: 2px;"><i class="fas fa-envelope"></i> ${r.responsavelEmail}</p>` : ''}
            </div>

            ${r.descricao ? `<p style="color: #475569; font-size: 14px; margin: 4px 0;"><i class="fas fa-info-circle" style="color: #64748b;"></i> ${r.descricao}</p>` : ''}

            <div class="card-actions">
                ${r.status !== 'cancelada' && !isPassado ? `
                    ${r.status === 'pendente' ? `<button class="btn-sm btn-aprovar" onclick="alterarStatusReserva('${r.id}', 'confirmada')"><i class="fas fa-check"></i> Confirmar</button>` : ''}
                    ${r.status === 'confirmada' ? `<button class="btn-sm btn-em_andamento" onclick="alterarStatusReserva('${r.id}', 'em_andamento')"><i class="fas fa-play"></i> Iniciar</button>` : ''}
                    ${r.status === 'em_andamento' ? `<button class="btn-sm btn-realizado" onclick="alterarStatusReserva('${r.id}', 'concluida')"><i class="fas fa-check"></i> Concluir</button>` : ''}
                    <button class="btn-sm btn-cancelado" onclick="alterarStatusReserva('${r.id}', 'cancelada')"><i class="fas fa-times"></i> Cancelar</button>
                ` : ''}
                <button class="btn-edit" onclick="editarReserva('${r.id}')">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn-sm btn-rejeitar" onclick="excluirReserva('${r.id}')">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

// ==================== FUNÇÃO VERIFICAR CONFLITO RESERVA ====================
function verificarConflitoReserva(reserva) {
    if (!reserva || !reserva.horario) {
        return false;
    }
    
    return reservasCache.some(r => {
        if (r.id === reserva.id) return false;
        if (r.status === 'cancelada') return false;
        if (r.sala !== reserva.sala) return false;
        if (r.data !== reserva.data) return false;
        
        if (!r.horario || !reserva.horario) return false;
        
        const rInicio = r.horario.split(':').map(Number);
        const reservaInicio = reserva.horario.split(':').map(Number);
        
        const rStart = rInicio[0] * 60 + rInicio[1];
        const rEnd = rStart + (r.duracao || 60);
        const reservaStart = reservaInicio[0] * 60 + reservaInicio[1];
        const reservaEnd = reservaStart + (reserva.duracao || 60);
        
        return (reservaStart < rEnd && reservaEnd > rStart);
    });
}

function atualizarStatsReservas() {
    const hoje = new Date();
    const hojeStr = hoje.toISOString().split('T')[0];
    
    const reservasHoje = reservasCache.filter(r => r.data === hojeStr && r.status !== 'cancelada');
    const confirmadas = reservasCache.filter(r => r.status === 'confirmada' || r.status === 'em_andamento');
    const pendentes = reservasCache.filter(r => r.status === 'pendente');
    
    const salasOcupadas = new Set(reservasHoje.map(r => r.sala));
    const totalSalas = Object.keys(SALAS_LABELS).length;
    const salasDisponiveis = totalSalas - salasOcupadas.size;

    document.getElementById('reservaTotalHoje').textContent = reservasHoje.length;
    document.getElementById('reservaConfirmadas').textContent = confirmadas.length;
    document.getElementById('reservaPendentes').textContent = pendentes.length;
    document.getElementById('reservaTotalSalas').textContent = `${salasDisponiveis}/${totalSalas}`;
}

function abrirModalReserva(reservaId = null) {
    reservaEmEdicao = reservaId;
    
    const modal = document.getElementById('modalReserva');
    const titulo = document.getElementById('modalReservaTitulo');
    
    if (reservaId) {
        titulo.textContent = '✏️ Editar Reserva de Sala';
        const reserva = reservasCache.find(r => r.id === reservaId);
        if (reserva) {
            document.getElementById('reservaId').value = reserva.id;
            document.getElementById('reservaSala').value = reserva.sala || '';
            document.getElementById('reservaCapacidade').value = reserva.capacidade || SALAS_CAPACIDADE[reserva.sala] || 4;
            document.getElementById('reservaData').value = reserva.data || '';
            document.getElementById('reservaHorario').value = reserva.horario || '';
            document.getElementById('reservaDuracao').value = reserva.duracao || 60;
            document.getElementById('reservaResponsavel').value = reserva.responsavelId || '';
            document.getElementById('reservaTitulo').value = reserva.titulo || '';
            document.getElementById('reservaDescricao').value = reserva.descricao || '';
            document.getElementById('reservaStatus').value = reserva.status || 'pendente';
            document.getElementById('reservaTipo').value = reserva.tipo || 'reuniao';
        }
    } else {
        titulo.textContent = '📋 Nova Reserva de Sala';
        document.getElementById('reservaId').value = '';
        document.getElementById('reservaSala').value = '';
        document.getElementById('reservaCapacidade').value = 4;
        document.getElementById('reservaData').value = '';
        document.getElementById('reservaHorario').value = '';
        document.getElementById('reservaDuracao').value = 60;
        document.getElementById('reservaResponsavel').value = '';
        document.getElementById('reservaTitulo').value = '';
        document.getElementById('reservaDescricao').value = '';
        document.getElementById('reservaStatus').value = 'pendente';
        document.getElementById('reservaTipo').value = 'reuniao';
    }
    
    atualizarSelectReservaResponsavel();
    
    document.getElementById('reservaSala').onchange = function() {
        const sala = this.value;
        if (sala && SALAS_CAPACIDADE[sala]) {
            document.getElementById('reservaCapacidade').value = SALAS_CAPACIDADE[sala];
        }
    };
    
    modal.style.display = 'flex';
}

function fecharModalReserva() {
    const modal = document.getElementById('modalReserva');
    if (modal) {
        modal.style.display = 'none';
    }
    reservaEmEdicao = null;
}

// ==================== FUNÇÃO SALVAR RESERVA (CORRIGIDA) ====================
async function salvarReserva() {
    const id = document.getElementById('reservaId').value;
    const sala = document.getElementById('reservaSala').value;
    const capacidade = parseInt(document.getElementById('reservaCapacidade').value) || 4;
    const data = document.getElementById('reservaData').value;
    const horario = document.getElementById('reservaHorario').value;
    const duracao = parseInt(document.getElementById('reservaDuracao').value) || 60;
    const responsavelId = document.getElementById('reservaResponsavel').value;
    const titulo = document.getElementById('reservaTitulo').value.trim();
    const descricao = document.getElementById('reservaDescricao').value.trim();
    const status = document.getElementById('reservaStatus').value;
    const tipo = document.getElementById('reservaTipo').value;

    // Validar campos obrigatórios
    if (!sala || !data || !horario || !responsavelId || !titulo) {
        alert('❌ Preencha todos os campos obrigatórios: Sala, Data, Horário, Responsável e Título.');
        return;
    }

    // Verificar colaborador
    const colaborador = colaboradoresCache.find(c => c.id === responsavelId);
    if (!colaborador) {
        alert('❌ Colaborador não encontrado!');
        return;
    }

    if (colaborador.ativo === false) {
        alert('❌ Este colaborador está inativo. Selecione um colaborador ativo.');
        return;
    }

    // Verificar conflitos
    try {
        const reservaTeste = {
            id: id || 'novo',
            sala: sala,
            data: data,
            horario: horario,
            duracao: duracao,
            status: status
        };

        if (verificarConflitoReserva(reservaTeste)) {
            if (!confirm('⚠️ Esta reserva conflita com outra reserva existente na mesma sala e horário. Deseja continuar mesmo assim?')) {
                return;
            }
        }
    } catch (error) {
        console.error('Erro ao verificar conflitos:', error);
    }

    // Salvar reserva
    try {
        const dados = {
            sala: sala,
            capacidade: capacidade || SALAS_CAPACIDADE[sala] || 4,
            data: data,
            horario: horario,
            duracao: duracao,
            responsavelId: responsavelId,
            responsavelNome: colaborador.nome,
            responsavelEmail: colaborador.email,
            responsavelCargo: colaborador.cargo || '',
            titulo: titulo,
            descricao: descricao || '',
            status: status || 'pendente',
            tipo: tipo || 'reuniao',
            atualizadoEm: firebase.firestore.FieldValue.serverTimestamp(),
            atualizadoPor: currentUser.uid,
            atualizadoPorNome: currentUser.nome
        };

        if (id) {
            await db.collection('reservasSalas').doc(id).update(dados);
            alert('✅ Reserva atualizada com sucesso!');
        } else {
            dados.criadoEm = firebase.firestore.FieldValue.serverTimestamp();
            dados.criadoPor = currentUser.uid;
            dados.criadoPorNome = currentUser.nome;
            await db.collection('reservasSalas').add(dados);
            alert('✅ Reserva criada com sucesso!');
        }
        
        fecharModalReserva();

    } catch (error) {
        console.error("Erro ao salvar reserva:", error);
        alert('❌ Erro ao salvar: ' + error.message);
    }
}

function editarReserva(id) {
    abrirModalReserva(id);
}

function excluirReserva(id) {
    const reserva = reservasCache.find(r => r.id === id);
    if (!reserva) return;
    
    if (!confirm(`Deseja excluir a reserva "${reserva.titulo}" da sala ${SALAS_LABELS[reserva.sala] || reserva.sala}?`)) {
        return;
    }
    
    try {
        db.collection('reservasSalas').doc(id).delete();
        alert('✅ Reserva excluída com sucesso!');
    } catch (error) {
        console.error("Erro ao excluir reserva:", error);
        alert('❌ Erro ao excluir: ' + error.message);
    }
}

async function alterarStatusReserva(id, novoStatus) {
    const statusLabels = {
        'pendente': '🟡 Pendente',
        'confirmada': '🟢 Confirmada',
        'em_andamento': '🔄 Em Andamento',
        'concluida': '✅ Concluída',
        'cancelada': '❌ Cancelada'
    };

    if (!confirm(`Deseja alterar o status da reserva para "${statusLabels[novoStatus]}"?`)) {
        return;
    }

    try {
        await db.collection('reservasSalas').doc(id).update({
            status: novoStatus,
            statusAtualizadoEm: firebase.firestore.FieldValue.serverTimestamp(),
            statusAtualizadoPor: currentUser.uid,
            statusAtualizadoPorNome: currentUser.nome
        });
        alert(`✅ Status alterado para "${statusLabels[novoStatus]}" com sucesso!`);
    } catch (error) {
        console.error("Erro ao alterar status:", error);
        alert('❌ Erro ao alterar status: ' + error.message);
    }
}

function filtrarReservas() {
    filtroReservaDataAtual = document.getElementById('filtroReservaData').value || '';
    filtroReservaSalaAtual = document.getElementById('filtroReservaSala').value || '';
    filtroReservaStatusAtual = document.getElementById('filtroReservaStatus').value || '';
    atualizarListaReservas();
}

function limparFiltrosReservas() {
    document.getElementById('filtroReservaData').value = '';
    document.getElementById('filtroReservaSala').value = '';
    document.getElementById('filtroReservaStatus').value = '';
    filtroReservaDataAtual = '';
    filtroReservaSalaAtual = '';
    filtroReservaStatusAtual = '';
    atualizarListaReservas();
}

// ==================== FUNÇÕES PARA LIMITE DE ADMINISTRADORES ====================

async function verificarLimiteAdmin() {
    try {
        const configDoc = await db.collection('configuracoes').doc('limiteAdmin').get();
        let limite = 2;
        
        if (configDoc.exists) {
            limite = configDoc.data().limite || 2;
        }
        
        const adminsSnapshot = await db.collection('usuarios')
            .where('tipo', '==', 'admin')
            .get();
        
        const totalAdmins = adminsSnapshot.size;
        const vagas = Math.max(0, limite - totalAdmins);
        
        return {
            limite: limite,
            total: totalAdmins,
            vagas: vagas,
            podeCriar: vagas > 0,
            mensagem: `Total: ${totalAdmins} administradores | Limite: ${limite} | Vagas: ${vagas}`
        };
    } catch (error) {
        console.error("❌ Erro ao verificar limite de admin:", error);
        return {
            limite: 2,
            total: 0,
            vagas: 2,
            podeCriar: true,
            mensagem: 'Erro ao verificar limite'
        };
    }
}

async function atualizarLimiteAdmin(novoLimite) {
    try {
        await db.collection('configuracoes').doc('limiteAdmin').set({
            limite: novoLimite,
            atualizadoEm: firebase.firestore.FieldValue.serverTimestamp(),
            atualizadoPor: currentUser?.uid || 'sistema'
        });
        
        alert(`✅ Limite de administradores atualizado para ${novoLimite}.`);
        return true;
    } catch (error) {
        console.error("❌ Erro ao atualizar limite:", error);
        alert('❌ Erro ao salvar: ' + error.message);
        return false;
    }
}

async function carregarConfigLimiteAdmin() {
    try {
        const limiteInfo = await verificarLimiteAdmin();
        
        const elConfigurado = document.getElementById('limiteAdminConfigurado');
        const elAtual = document.getElementById('limiteAdminAtual');
        const elVagas = document.getElementById('limiteAdminVagas');
        const elStatus = document.getElementById('limiteAdminStatus');
        const elInput = document.getElementById('configLimiteAdmin');
        
        if (elConfigurado) elConfigurado.textContent = limiteInfo.limite;
        if (elAtual) elAtual.textContent = limiteInfo.total;
        if (elVagas) elVagas.textContent = limiteInfo.vagas;
        
        if (elStatus) {
            if (limiteInfo.podeCriar) {
                elStatus.textContent = '✅ Disponível';
                elStatus.style.color = '#10b981';
            } else {
                elStatus.textContent = '❌ Atingido';
                elStatus.style.color = '#ef4444';
            }
        }
        
        if (elInput) {
            elInput.value = limiteInfo.limite;
        }
        
    } catch (error) {
        console.error('❌ Erro ao carregar limite:', error);
    }
}

async function salvarLimiteAdmin() {
    const input = document.getElementById('configLimiteAdmin');
    if (!input) return;
    
    const novoLimite = parseInt(input.value);
    
    if (isNaN(novoLimite) || novoLimite < 1 || novoLimite > 20) {
        alert('❌ O limite deve ser entre 1 e 20.');
        return;
    }
    
    const atual = await verificarLimiteAdmin();
    
    if (novoLimite < atual.total) {
        if (!confirm(`⚠️ O novo limite (${novoLimite}) é menor que o número atual de administradores (${atual.total}).\n\nIsso pode impedir novos cadastros. Deseja continuar?`)) {
            return;
        }
    }
    
    const sucesso = await atualizarLimiteAdmin(novoLimite);
    
    if (sucesso) {
        await carregarConfigLimiteAdmin();
    }
}

// ==================== FUNÇÃO PARA DEBUG DO MENU ====================
function debugMenu() {
    console.log("=== DEBUG MENU ===");
    const items = document.querySelectorAll('.sidebar li');
    console.log("Total de itens no menu:", items.length);
    items.forEach((item, index) => {
        console.log(`Item ${index}:`, {
            id: item.id,
            section: item.dataset.section,
            display: item.style.display,
            visible: item.offsetParent !== null,
            classes: item.className
        });
    });
    console.log("=== FIM DEBUG ===");
}

// ==================== EXPOR FUNÇÕES GLOBAIS ====================
window.criarAdminInicial = criarAdminInicial;
window.trocarAba = trocarAba;
window.criarContaAdmin = criarContaAdmin;
window.corrigirDatasEventos = corrigirDatasEventos;
window.adicionarEvento = adicionarEvento;
window.editarEvento = editarEvento;
window.salvarEdicao = salvarEdicao;
window.fecharEdicao = fecharEdicao;
window.excluirEvento = excluirEvento;
window.cadastrarColaborador = cadastrarColaborador;
window.toggleColaborador = toggleColaborador;
window.confirmarExcluirColaborador = confirmarExcluirColaborador;
window.filtrarAgenda = filtrarAgenda;
window.filtrarPorStatus = filtrarPorStatus;
window.alterarStatus = alterarStatus;
window.limparFiltros = limparFiltros;
window.verAgendaPublica = verAgendaPublica;
window.salvarConfiguracoes = salvarConfiguracoes;
window.logout = logout;
window.fazerLogin = fazerLogin;
window.fecharModal = fecharModal;
window.renderizarDashboard = renderizarDashboard;
window.iniciarDashboard = iniciarDashboard;
window.filtrarPorPeriodo = filtrarPorPeriodo;
window.editarColaborador = editarColaborador;
window.fecharModalEditarColaborador = fecharModalEditarColaborador;
window.salvarEdicaoColaborador = salvarEdicaoColaborador;
window.atualizarEventosColaborador = atualizarEventosColaborador;
window.abrirModalFerias = abrirModalFerias;
window.fecharModalFerias = fecharModalFerias;
window.salvarFerias = salvarFerias;
window.excluirFerias = excluirFerias;
window.colaboradorEstaDeFerias = colaboradorEstaDeFerias;

window.abrirModalReserva = abrirModalReserva;
window.fecharModalReserva = fecharModalReserva;
window.salvarReserva = salvarReserva;
window.editarReserva = editarReserva;
window.excluirReserva = excluirReserva;
window.alterarStatusReserva = alterarStatusReserva;
window.filtrarReservas = filtrarReservas;
window.limparFiltrosReservas = limparFiltrosReservas;
window.iniciarListenerReservas = iniciarListenerReservas;

window.carregarConfiguracoesDemanda = carregarConfiguracoesDemanda;
window.salvarConfiguracoesDemanda = salvarConfiguracoesDemanda;
window.restaurarConfiguracoesDemandaPadrao = restaurarConfiguracoesDemandaPadrao;
window.getConfiguracoesDemanda = getConfiguracoesDemanda;
window.verificarDemandaColaborador = verificarDemandaColaborador;
window.exibirAlertaDemanda = exibirAlertaDemanda;
window.verificarDemandaAntesDeSalvar = verificarDemandaAntesDeSalvar;
window.exibirRelatorioDemanda = exibirRelatorioDemanda;

window.carregarConfiguracoesHorarios = carregarConfiguracoesHorarios;
window.salvarConfiguracoesHorarios = salvarConfiguracoesHorarios;
window.restaurarConfiguracoesHorariosPadrao = restaurarConfiguracoesHorariosPadrao;
window.getConfiguracoesHorarios = getConfiguracoesHorarios;
window.gerarSlotsHorarios = gerarSlotsHorarios;
window.visualizarHorariosDisponiveis = visualizarHorariosDisponiveis;
window.copiarLinkAgendaPublica = copiarLinkAgendaPublica;
window.atualizarLinkAgendaPublica = atualizarLinkAgendaPublica;

window.carregarBloqueiosHorarios = carregarBloqueiosHorarios;
window.atualizarSelectBloqueioHorarios = atualizarSelectBloqueioHorarios;
window.bloquearHorario = bloquearHorario;
window.desbloquearHorario = desbloquearHorario;
window.limparBloqueiosData = limparBloqueiosData;
window.iniciarListenerBloqueios = iniciarListenerBloqueios;
window.bloquearHorariosAutomaticamente = bloquearHorariosAutomaticamente;
window.removerBloqueiosAutomaticos = removerBloqueiosAutomaticos;

window.verificarConflitoComBloqueios = verificarConflitoComBloqueios;
window.verificarConflitoComEventos = verificarConflitoComEventos;
window.verificarTodosConflitos = verificarTodosConflitos;
window.validarHorarioDisponivel = validarHorarioDisponivel;
window.getHorariosOcupados = getHorariosOcupados;
window.horarioParaMinutos = horarioParaMinutos;
window.minutosParaHorario = minutosParaHorario;

window.carregarConfigLimiteAdmin = carregarConfigLimiteAdmin;
window.salvarLimiteAdmin = salvarLimiteAdmin;
window.debugMenu = debugMenu;

// Funções de navegação de data
window.buscarEventosPorData = buscarEventosPorData;
window.navegarData = navegarData;
window.irParaHoje = irParaHoje;
window.atualizarDataExibicao = atualizarDataExibicao;

// ==================== VERIFICAR ADMIN EXISTENTE ====================
async function verificarAdminExistente() {
    try {
        const snapshot = await db.collection('usuarios')
            .where('tipo', '==', 'admin')
            .get();
        
        const adminCount = snapshot.size;
        const mensagemDiv = document.getElementById('mensagemAdminExistente');
        
        if (mensagemDiv) {
            if (adminCount === 0) {
                mensagemDiv.innerHTML = `
                    <div style="margin-top: 16px; padding: 12px; background: #fef3c7; border-radius: 8px; border: 1px solid #fcd34d; text-align: center;">
                        <i class="fas fa-info-circle" style="color: #d97706;"></i>
                        <span style="color: #92400e; font-size: 13px;">
                            Nenhum administrador cadastrado. 
                            <a href="criar-admin.html" style="color: #2563eb; font-weight: 600; text-decoration: none;">Criar primeiro administrador →</a>
                        </span>
                    </div>
                `;
            } else if (adminCount >= 2) {
                mensagemDiv.innerHTML = `
                    <div style="margin-top: 16px; padding: 12px; background: #fef3c7; border-radius: 8px; border: 1px solid #fcd34d; text-align: center;">
                        <i class="fas fa-info-circle" style="color: #d97706;"></i>
                        <span style="color: #92400e; font-size: 13px;">
                            Limite de administradores atingido (${adminCount}/2).
                        </span>
                    </div>
                `;
            } else {
                mensagemDiv.innerHTML = '';
            }
        }
    } catch (error) {
        console.error("Erro ao verificar administradores:", error);
    }
}

// ==================== EXECUTAR VERIFICAÇÃO AO CARREGAR ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log("📄 Página carregada, aguardando autenticação...");
    setTimeout(iniciarObservadorMenu, 500);
});