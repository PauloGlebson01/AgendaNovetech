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
    'sala_01': 0,
    'sala_02': 0,
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

// ==================== VERIFICAÇÃO DE AUTENTICAÇÃO ====================
auth.onAuthStateChanged(async (user) => {
    console.log("Auth state changed:", user ? user.email : "null");
    
    if (user) {
        // 🔥 Verificar status do usuário (sistema de aprovação)
        if (typeof verificarStatusUsuario === 'function') {
            const statusResult = await verificarStatusUsuario(user);
            
            if (!statusResult || statusResult.status === 'nao_encontrado') {
                // Usuário não encontrado ou removido
                return;
            }
            
            if (statusResult.status === 'solicitante' || statusResult.status === 'rejeitado') {
                // Usuário não aprovado - já foi deslogado pela função
                return;
            }
        }
        
        // Usuário aprovado - continuar fluxo normal
        try {
            const userDoc = await db.collection('usuarios').doc(user.uid).get();
            
            if (!userDoc.exists) {
                console.error("Usuário não encontrado no Firestore");
                await auth.signOut();
                alert("Usuário não cadastrado no sistema. Contate o administrador.");
                return;
            }
            
            currentUser = { uid: user.uid, ...userDoc.data() };
            
            if (currentUser.tipo !== 'admin') {
                await auth.signOut();
                alert("Acesso permitido apenas para administradores.");
                return;
            }
            
            sessionStorage.setItem('userTipo', currentUser.tipo);
            sessionStorage.setItem('userNome', currentUser.nome);
            
            const path = window.location.pathname;
            if (path.includes('index.html') || path === '/' || path.endsWith('/')) {
                window.location.href = 'admin.html';
            } else if (path.includes('admin.html')) {
                await carregarAdmin();
                // 🔥 Carregar solicitações pendentes
                if (typeof carregarSolicitacoesPendentes === 'function') {
                    await carregarSolicitacoesPendentes();
                }
                if (typeof iniciarListenerSolicitacoes === 'function') {
                    iniciarListenerSolicitacoes();
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
        
        // Verificar se o usuário está aprovado
        if (userData.aprovado !== true || userData.tipo === 'solicitante' || userData.tipo === 'rejeitado') {
            await auth.signOut();
            if (userData.tipo === 'rejeitado') {
                alert(`❌ Seu cadastro foi rejeitado.\nMotivo: ${userData.motivoRejeicao || 'Não informado'}\n\nEntre em contato com o administrador.`);
            } else {
                alert('⏳ Seu cadastro está aguardando aprovação.\n\nVocê receberá um e-mail quando for aprovado.');
            }
            return;
        }
        
        if (userData.tipo !== 'admin') {
            await auth.signOut();
            alert('Acesso permitido apenas para administradores.');
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

// ==================== ADMIN ====================
async function carregarAdmin() {
    if (!currentUser || currentUser.tipo !== 'admin') {
        console.log("Usuário não é admin");
        return;
    }
    
    document.getElementById('adminName').textContent = currentUser.nome;
    
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
        iniciarListenersRealtime();
        iniciarDashboard();
        
    } catch (error) {
        console.error("Erro ao carregar admin:", error);
        alert("Erro ao carregar dados: " + error.message);
    }
    
    iniciarSidebar();
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
    
    unsubscribeEventos = db.collection('eventosAgenda')
        .orderBy('data', 'asc')
        .onSnapshot((snapshot) => {
            console.log("🔄 Eventos atualizados em tempo real!");
            snapshot.docChanges().forEach(change => {
                if (change.type === 'added') {
                    console.log("📌 Novo evento adicionado:", change.doc.data().titulo);
                }
                if (change.type === 'modified') {
                    console.log("✏️ Evento modificado:", change.doc.data().titulo);
                }
                if (change.type === 'removed') {
                    console.log("🗑️ Evento removido");
                }
            });
            atualizarListaEventos(snapshot);
            atualizarContadorStatus(snapshot);
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
                <i class="fas fa-calendar-plus" style="font-size: 48px; color: #cbd5e1;"></i>
                <h3 style="margin-top: 12px; color: #475569;">Nenhum evento encontrado</h3>
                <p style="color: #94a3b8;">Ajuste os filtros ou adicione um novo evento na aba "Gerenciar Agenda"</p>
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

function aplicarFiltrosCompletos() {
    const dataFiltro = document.getElementById('filtroData').value;
    const statusFiltro = document.getElementById('filtroStatus').value;
    
    filtroDataAtual = dataFiltro;
    filtroStatusAtual = statusFiltro;

    if (!dataFiltro && !statusFiltro) {
        if (unsubscribeEventos) {
            unsubscribeEventos();
        }
        unsubscribeEventos = db.collection('eventosAgenda')
            .orderBy('data', 'asc')
            .onSnapshot((snapshot) => {
                atualizarListaEventos(snapshot);
                atualizarContadorStatus(snapshot);
            });
        return;
    }

    const container = document.getElementById('listaEventosAdmin');
    container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Filtrando...</div>';

    if (unsubscribeEventos) {
        unsubscribeEventos();
    }

    let query = db.collection('eventosAgenda');

    if (dataFiltro) {
        const dataInicio = dataFiltro + 'T00:00:00.000Z';
        const dataFim = dataFiltro + 'T23:59:59.999Z';
        query = query.where('data', '>=', dataInicio).where('data', '<=', dataFim);
    }

    if (statusFiltro) {
        query = query.where('status', '==', statusFiltro);
    }

    unsubscribeEventos = query.onSnapshot((snapshot) => {
        let eventos = [];
        snapshot.forEach(doc => {
            eventos.push({ id: doc.id, ...doc.data() });
        });
        
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
        
    }, (error) => {
        console.error("Erro ao filtrar:", error);
        container.innerHTML = `
            <div class="card" style="grid-column: 1 / -1; color: #ef4444; text-align: center; padding: 40px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 32px;"></i>
                <p style="margin-top: 8px;"><strong>Erro ao filtrar:</strong> ${error.message}</p>
                <button onclick="limparFiltros()" style="margin-top: 12px; padding: 8px 20px; background: #2563eb; color: white; border: none; border-radius: 8px; cursor: pointer;">
                    <i class="fas fa-undo"></i> Limpar Filtros
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

// ==================== FILTROS (ORIGINAIS) ====================
function filtrarAgenda() {
    aplicarFiltrosCompletos();
}

function limparFiltros() {
    document.getElementById('filtroData').value = '';
    document.getElementById('filtroStatus').value = '';
    filtroDataAtual = '';
    filtroStatusAtual = '';
    
    if (unsubscribeEventos) {
        unsubscribeEventos();
    }
    unsubscribeEventos = db.collection('eventosAgenda')
        .orderBy('data', 'asc')
        .onSnapshot((snapshot) => {
            atualizarListaEventos(snapshot);
            atualizarContadorStatus(snapshot);
        });
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
                ${dataStr} - <strong>${b.horario}</strong>
                ${b.motivo ? ` (${b.motivo})` : ''}
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
        const horariosBloqueados = bloqueios.map(b => b.horario);
        
        result.slots.forEach(slot => {
            const option = document.createElement('option');
            option.value = slot.inicio;
            
            const estaBloqueado = horariosBloqueados.includes(slot.inicio);
            const estaOcupado = slot.ocupado === true;
            
            let label = `${slot.inicio} - ${slot.fim}`;
            if (estaBloqueado) {
                label += ' 🔒 (Bloqueado)';
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
    
    if (!data) {
        alert('❌ Selecione uma data para bloquear.');
        return;
    }
    
    if (!horario) {
        alert('❌ Selecione um horário para bloquear.');
        return;
    }
    
    if (bloqueiosCache.some(b => b.data === data && b.horario === horario)) {
        alert('⚠️ Este horário já está bloqueado.');
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
            motivo: motivo || 'Indisponível',
            criadoEm: new Date().toISOString(),
            criadoPor: currentUser?.uid || 'sistema',
            criadoPorNome: currentUser?.nome || 'sistema'
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

// ==================== FUNÇÃO GERAR SLOTS ATUALIZADA (COM BLOQUEIOS) ====================

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
        const duracao = config.duracaoSlot || 60;
        
        const [horaInicio, minInicio] = inicio.split(':').map(Number);
        const [horaFim, minFim] = fim.split(':').map(Number);
        
        const slots = [];
        let horaAtual = horaInicio;
        let minAtual = minInicio;
        
        while (horaAtual < horaFim || (horaAtual === horaFim && minAtual < minFim)) {
            const horaStr = String(horaAtual).padStart(2, '0');
            const minStr = String(minAtual).padStart(2, '0');
            const horaFimSlot = new Date(0, 0, 0, horaAtual, minAtual + duracao);
            const horaFimStr = String(horaFimSlot.getHours()).padStart(2, '0');
            const minFimStr = String(horaFimSlot.getMinutes()).padStart(2, '0');
            
            slots.push({
                inicio: `${horaStr}:${minStr}`,
                fim: `${horaFimStr}:${minFimStr}`,
                inicioObj: new Date(0, 0, 0, horaAtual, minAtual),
                fimObj: new Date(0, 0, 0, horaFimSlot.getHours(), horaFimSlot.getMinutes())
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
            eventosAgendados.push({ id: doc.id, ...doc.data() });
        });
        
        const bloqueios = bloqueiosCache.filter(b => b.data === data);
        const horariosBloqueados = bloqueios.map(b => b.horario);
        
        const slotsDisponiveis = slots.map(slot => {
            const ocupado = eventosAgendados.some(e => {
                const eData = new Date(e.data);
                const eHora = eData.getHours();
                const eMin = eData.getMinutes();
                const eDuracao = e.duracao || 60;
                
                const slotInicio = slot.inicioObj;
                const slotFim = slot.fimObj;
                const eventoInicio = new Date(0, 0, 0, eHora, eMin);
                const eventoFim = new Date(0, 0, 0, eHora, eMin + eDuracao);
                
                return (slotInicio < eventoFim && slotFim > eventoInicio);
            });
            
            const bloqueado = horariosBloqueados.includes(slot.inicio);
            
            return {
                ...slot,
                disponivel: !ocupado && !bloqueado,
                ocupado: ocupado,
                bloqueado: bloqueado,
                bloqueadoMotivo: bloqueado ? bloqueios.find(b => b.horario === slot.inicio)?.motivo : null
            };
        });
        
        return {
            disponivel: true,
            slots: slotsDisponiveis,
            config: {
                inicio,
                fim,
                intervalo,
                duracao,
                emailSuporte: config.emailSuporte
            }
        };
        
    } catch (error) {
        console.error("❌ Erro ao gerar slots de horários:", error);
        return { disponivel: false, slots: [], motivo: 'Erro ao gerar horários' };
    }
}

// ==================== CONTROLE DE LIMITE DE EVENTOS POR COLABORADOR ====================

async function verificarDemandaColaborador(colaboradorId, data, duracao = 60) {
    if (!colaboradorId || !data) {
        return { error: 'Colaborador ou data não informados' };
    }

    try {
        const config = await getConfiguracoesDemanda();
        
        if (config.ativo === false) {
            return {
                nivelDemanda: 'baixa',
                mensagemDemanda: 'Sistema de demanda desativado',
                corDemanda: '#94a3b8',
                ultrapassouLimite: false,
                atingiuLimite: false,
                temConflito: false,
                eventosDia: 0,
                eventosDiaComNovo: 1,
                eventosSemana: 0,
                eventosMes: 0,
                horasOcupadas: 0,
                limiteDiario: config.limiteDiario,
                limiteSemanal: config.limiteSemanal,
                limiteMensal: config.limiteMensal,
                cargaHorariaMaxima: config.cargaHorariaMaxima,
                sistemaAtivo: false
            };
        }

        const dataInicio = data + 'T00:00:00.000Z';
        const dataFim = data + 'T23:59:59.999Z';

        const eventosDiaSnapshot = await db.collection('eventosAgenda')
            .where('responsavelId', '==', colaboradorId)
            .where('data', '>=', dataInicio)
            .where('data', '<=', dataFim)
            .get();

        const eventosDia = [];
        eventosDiaSnapshot.forEach(doc => {
            eventosDia.push({ id: doc.id, ...doc.data() });
        });

        let minutosOcupados = 0;
        eventosDia.forEach(e => {
            const duracaoEvento = e.duracao || 60;
            minutosOcupados += duracaoEvento;
        });

        const minutosTotais = minutosOcupados + (duracao || 60);
        const horasTotais = Math.round(minutosTotais / 60 * 10) / 10;

        const hoje = new Date();
        const dataSemanaInicio = new Date(hoje);
        dataSemanaInicio.setDate(hoje.getDate() - 7);
        const dataSemanaInicioStr = dataSemanaInicio.toISOString().split('T')[0] + 'T00:00:00.000Z';

        const eventosSemanaSnapshot = await db.collection('eventosAgenda')
            .where('responsavelId', '==', colaboradorId)
            .where('data', '>=', dataSemanaInicioStr)
            .get();

        const totalEventosSemana = eventosSemanaSnapshot.size;

        const dataMesInicio = new Date(hoje);
        dataMesInicio.setDate(hoje.getDate() - 30);
        const dataMesInicioStr = dataMesInicio.toISOString().split('T')[0] + 'T00:00:00.000Z';

        const eventosMesSnapshot = await db.collection('eventosAgenda')
            .where('responsavelId', '==', colaboradorId)
            .where('data', '>=', dataMesInicioStr)
            .get();

        const totalEventosMes = eventosMesSnapshot.size;

        const dataCompleta = data + 'T' + document.getElementById('eventoHorario')?.value + ':00.000Z' || '';
        const conflitos = eventosDia.filter(e => {
            if (e.id === 'novo') return false;
            const eData = new Date(e.data);
            const novaData = new Date(dataCompleta);
            const diffMinutos = Math.abs(eData.getTime() - novaData.getTime()) / (1000 * 60);
            return diffMinutos < (e.duracao || 60);
        });

        let nivelDemanda = 'baixa';
        let mensagemDemanda = '';
        let corDemanda = '#10b981';

        const totalEventosDia = eventosDia.length;
        const totalEventosDiaComNovo = totalEventosDia + 1;
        const limiteDiario = config.limiteDiario || 5;
        const limiteSemanal = config.limiteSemanal || 15;
        const limiteMensal = config.limiteMensal || 30;
        const cargaHorariaMaxima = config.cargaHorariaMaxima || 8;

        if (totalEventosDiaComNovo >= limiteDiario) {
            nivelDemanda = 'critica';
            mensagemDemanda = `⚠️ ALTA DEMANDA: Este colaborador já possui ${totalEventosDia} evento(s) hoje. Este será o ${totalEventosDiaComNovo}º.`;
            corDemanda = '#ef4444';
        } else if (totalEventosDiaComNovo >= limiteDiario - 1) {
            nivelDemanda = 'alta';
            mensagemDemanda = `⚡ ATENÇÃO: Este colaborador está com ${totalEventosDia} evento(s) hoje. Próximo do limite diário (${limiteDiario}).`;
            corDemanda = '#f59e0b';
        } else if (totalEventosDia >= 3) {
            nivelDemanda = 'media';
            mensagemDemanda = `📊 Demanda moderada: ${totalEventosDia} evento(s) hoje.`;
            corDemanda = '#3b82f6';
        }

        if (totalEventosSemana >= limiteSemanal) {
            if (nivelDemanda !== 'critica') {
                nivelDemanda = 'alta';
                mensagemDemanda += ` 📅 ${totalEventosSemana} eventos na semana (limite ${limiteSemanal}).`;
                corDemanda = '#f59e0b';
            }
        }

        if (totalEventosMes >= limiteMensal) {
            if (nivelDemanda !== 'critica') {
                nivelDemanda = 'alta';
                mensagemDemanda += ` 📆 ${totalEventosMes} eventos no mês (limite ${limiteMensal}).`;
                corDemanda = '#f59e0b';
            }
        }

        if (horasTotais > cargaHorariaMaxima) {
            if (nivelDemanda !== 'critica') {
                nivelDemanda = 'alta';
                mensagemDemanda += ` ⏰ ${horasTotais}h ocupadas hoje (limite ${cargaHorariaMaxima}h).`;
                corDemanda = '#f59e0b';
            }
        }

        const temConflito = conflitos.length > 0;

        return {
            colaboradorId,
            data,
            duracao,
            eventosDia: totalEventosDia,
            eventosDiaComNovo: totalEventosDiaComNovo,
            eventosSemana: totalEventosSemana,
            eventosMes: totalEventosMes,
            minutosOcupados: minutosTotais,
            horasOcupadas: horasTotais,
            conflitos: conflitos.length,
            temConflito,
            nivelDemanda,
            mensagemDemanda,
            corDemanda,
            ultrapassouLimite: totalEventosDiaComNovo > limiteDiario,
            atingiuLimite: totalEventosDiaComNovo >= limiteDiario,
            limiteDiario: limiteDiario,
            limiteSemanal: limiteSemanal,
            limiteMensal: limiteMensal,
            cargaHorariaMaxima: cargaHorariaMaxima,
            sistemaAtivo: config.ativo !== false
        };

    } catch (error) {
        console.error("Erro ao verificar demanda do colaborador:", error);
        return { error: error.message };
    }
}

function exibirAlertaDemanda(demanda, colaboradorNome) {
    return new Promise((resolve) => {
        if (demanda.error) {
            console.error("Erro ao verificar demanda:", demanda.error);
            resolve(true);
            return;
        }

        if (demanda.nivelDemanda === 'baixa' && !demanda.temConflito) {
            resolve(true);
            return;
        }

        let mensagem = '';
        let icone = 'ℹ️';

        if (demanda.temConflito) {
            mensagem += `⚠️ CONFLITO DE HORÁRIO: Este colaborador já possui ${demanda.conflitos} evento(s) neste mesmo horário.\n\n`;
        }

        if (demanda.ultrapassouLimite) {
            icone = '🚨';
            mensagem += `🚨 EXCEDEU O LIMITE DIÁRIO!\n`;
            mensagem += `Este colaborador já possui ${demanda.eventosDia} evento(s) hoje.\n`;
            mensagem += `Adicionar mais um evento ultrapassará o limite de ${demanda.limiteDiario} eventos/dia.\n\n`;
        } else if (demanda.atingiuLimite) {
            icone = '⚠️';
            mensagem += `⚠️ ATINGIU O LIMITE DIÁRIO!\n`;
            mensagem += `Este colaborador já possui ${demanda.eventosDia} evento(s) hoje.\n`;
            mensagem += `Este será o ${demanda.eventosDiaComNovo}º evento, atingindo o limite de ${demanda.limiteDiario} eventos/dia.\n\n`;
        }

        if (demanda.eventosSemana >= demanda.limiteSemanal) {
            mensagem += `📅 Limite semanal: ${demanda.eventosSemana} eventos (limite ${demanda.limiteSemanal})\n`;
        }

        if (demanda.eventosMes >= demanda.limiteMensal) {
            mensagem += `📆 Limite mensal: ${demanda.eventosMes} eventos (limite ${demanda.limiteMensal})\n`;
        }

        if (demanda.horasOcupadas > demanda.cargaHorariaMaxima) {
            mensagem += `⏰ Carga horária: ${demanda.horasOcupadas}h ocupadas hoje (limite ${demanda.cargaHorariaMaxima}h)\n`;
        }

        mensagem += `\nColaborador: ${colaboradorNome}`;
        mensagem += `\nEventos hoje: ${demanda.eventosDia} | Com este: ${demanda.eventosDiaComNovo}`;
        mensagem += `\n\nDeseja continuar mesmo assim?`;

        const modal = document.createElement('div');
        modal.className = 'modal-demanda';
        modal.style.cssText = `
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

        const cor = demanda.ultrapassouLimite ? '#ef4444' : demanda.corDemanda || '#f59e0b';

        modal.innerHTML = `
            <div style="
                background: white;
                border-radius: 20px;
                padding: 32px;
                max-width: 500px;
                width: 90%;
                box-shadow: 0 25px 50px -12px rgba(0,0,0,0.3);
                border-top: 6px solid ${cor};
            ">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                    <span style="font-size: 32px;">${icone}</span>
                    <h3 style="margin: 0; color: #0f172a; font-size: 20px;">
                        ${demanda.ultrapassouLimite ? 'Limite Excedido!' : 'Atenção - Alta Demanda'}
                    </h3>
                </div>
                <div style="
                    background: ${cor}15;
                    border-left: 4px solid ${cor};
                    padding: 12px 16px;
                    border-radius: 8px;
                    margin-bottom: 16px;
                    white-space: pre-line;
                    font-size: 14px;
                    color: #1e293b;
                    line-height: 1.6;
                    max-height: 300px;
                    overflow-y: auto;
                ">
                    ${mensagem}
                </div>
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button onclick="this.closest('.modal-demanda').remove(); window._demandaResolve(false);" style="
                        flex: 1;
                        padding: 12px;
                        border-radius: 12px;
                        border: none;
                        background: #e2e8f0;
                        color: #1e293b;
                        font-weight: 600;
                        cursor: pointer;
                        font-family: inherit;
                        transition: all 0.2s;
                    ">
                        <i class="fas fa-times"></i> Cancelar
                    </button>
                    <button onclick="this.closest('.modal-demanda').remove(); window._demandaResolve(true);" style="
                        flex: 1;
                        padding: 12px;
                        border-radius: 12px;
                        border: none;
                        background: ${cor};
                        color: white;
                        font-weight: 600;
                        cursor: pointer;
                        font-family: inherit;
                        transition: all 0.2s;
                    ">
                        <i class="fas fa-check"></i> Continuar
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        window._demandaResolve = (resultado) => {
            resolve(resultado);
        };

        if (!demanda.ultrapassouLimite) {
            modal.addEventListener('click', function(e) {
                if (e.target === this) {
                    this.remove();
                    window._demandaResolve(false);
                }
            });
        }

        setTimeout(() => {
            if (window._demandaResolve) {
                window._demandaResolve(false);
                window._demandaResolve = null;
            }
        }, 60000);
    });
}

async function verificarDemandaAntesDeSalvar(colaboradorId, colaboradorNome, data, duracao = 60) {
    if (!colaboradorId || !data) {
        return true;
    }

    try {
        const demanda = await verificarDemandaColaborador(colaboradorId, data, duracao);
        
        if (demanda.error) {
            console.error("Erro na verificação:", demanda.error);
            return true;
        }

        if (demanda.nivelDemanda === 'baixa' && !demanda.temConflito) {
            return true;
        }

        const continuar = await exibirAlertaDemanda(demanda, colaboradorNome);
        return continuar;

    } catch (error) {
        console.error("Erro ao verificar demanda:", error);
        return true;
    }
}

async function exibirRelatorioDemanda(colaboradorId) {
    if (!colaboradorId) {
        alert('Selecione um colaborador para visualizar a demanda.');
        return;
    }

    const colaborador = colaboradoresCache.find(c => c.id === colaboradorId);
    if (!colaborador) {
        alert('Colaborador não encontrado.');
        return;
    }

    const hoje = new Date();
    const dataHoje = hoje.toISOString().split('T')[0];

    try {
        const demanda = await verificarDemandaColaborador(colaboradorId, dataHoje);

        if (demanda.error) {
            alert('Erro ao buscar dados: ' + demanda.error);
            return;
        }

        const dataInicio = dataHoje + 'T00:00:00.000Z';
        const dataFim = dataHoje + 'T23:59:59.999Z';
        
        const eventosSnapshot = await db.collection('eventosAgenda')
            .where('responsavelId', '==', colaboradorId)
            .where('data', '>=', dataInicio)
            .where('data', '<=', dataFim)
            .orderBy('data', 'asc')
            .get();

        let eventosHoje = [];
        eventosSnapshot.forEach(doc => {
            eventosHoje.push({ id: doc.id, ...doc.data() });
        });

        const modal = document.createElement('div');
        modal.className = 'modal-demanda';
        modal.style.cssText = `
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

        const nivelLabel = {
            'baixa': '🟢 Baixa',
            'media': '🟡 Média',
            'alta': '🟠 Alta',
            'critica': '🔴 Crítica'
        };

        const corNivel = {
            'baixa': '#10b981',
            'media': '#3b82f6',
            'alta': '#f59e0b',
            'critica': '#ef4444'
        };

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
                        <i class="fas fa-chart-bar" style="color: #2563eb;"></i>
                        Demanda - ${colaborador.nome}
                    </h3>
                    <button onclick="this.closest('.modal-demanda').remove()" style="
                        background: none;
                        border: none;
                        font-size: 24px;
                        cursor: pointer;
                        color: #94a3b8;
                    ">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
                    <div style="background: #f1f5f9; padding: 12px; border-radius: 12px; text-align: center;">
                        <div style="font-size: 24px; font-weight: 700; color: #0f172a;">${demanda.eventosDia}</div>
                        <div style="font-size: 12px; color: #64748b;">Eventos Hoje</div>
                    </div>
                    <div style="background: #f1f5f9; padding: 12px; border-radius: 12px; text-align: center;">
                        <div style="font-size: 24px; font-weight: 700; color: #0f172a;">${demanda.eventosSemana}</div>
                        <div style="font-size: 12px; color: #64748b;">Últimos 7 dias</div>
                    </div>
                    <div style="background: #f1f5f9; padding: 12px; border-radius: 12px; text-align: center;">
                        <div style="font-size: 24px; font-weight: 700; color: #0f172a;">${demanda.eventosMes}</div>
                        <div style="font-size: 12px; color: #64748b;">Últimos 30 dias</div>
                    </div>
                    <div style="background: #f1f5f9; padding: 12px; border-radius: 12px; text-align: center; border-left: 4px solid ${corNivel[demanda.nivelDemanda]};">
                        <div style="font-size: 20px; font-weight: 700; color: ${corNivel[demanda.nivelDemanda]};">${nivelLabel[demanda.nivelDemanda]}</div>
                        <div style="font-size: 12px; color: #64748b;">Nível de Demanda</div>
                    </div>
                </div>

                ${demanda.horasOcupadas > 0 ? `
                    <div style="background: #f0f7ff; padding: 12px 16px; border-radius: 10px; margin-bottom: 16px;">
                        <span style="font-size: 14px; color: #1e293b;">
                            ⏰ Carga horária hoje: <strong>${demanda.horasOcupadas}h</strong>
                            ${demanda.horasOcupadas > demanda.cargaHorariaMaxima ? ' (⚠️ Acima do limite)' : ''}
                        </span>
                    </div>
                ` : ''}

                ${eventosHoje.length > 0 ? `
                    <div style="margin-top: 16px;">
                        <h4 style="margin: 0 0 8px 0; color: #0f172a; font-size: 14px;">
                            <i class="fas fa-list"></i> Eventos de hoje
                        </h4>
                        <div style="max-height: 200px; overflow-y: auto;">
                            ${eventosHoje.map(e => `
                                <div style="display: flex; justify-content: space-between; padding: 8px 12px; background: #f8fafc; border-radius: 8px; margin-bottom: 4px; border-left: 3px solid ${TIPO_BORDER_COLORS[e.tipo] || '#2563eb'};">
                                    <span style="font-size: 13px;">${e.titulo}</span>
                                    <span style="font-size: 12px; color: #64748b;">${extrairHoraParaExibicao(e.data)}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <div style="margin-top: 16px; padding: 12px; background: #f1f5f9; border-radius: 10px; font-size: 13px; color: #64748b;">
                    <i class="fas fa-info-circle"></i>
                    Limites: ${demanda.limiteDiario} eventos/dia | ${demanda.limiteSemanal} eventos/semana | ${demanda.limiteMensal} eventos/mês | ${demanda.cargaHorariaMaxima}h/dia
                </div>

                <button onclick="this.closest('.modal-demanda').remove()" style="
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
        console.error("Erro ao exibir relatório:", error);
        alert('Erro ao carregar dados: ' + error.message);
    }
}

// ==================== ADICIONAR EVENTO ====================
async function adicionarEvento() {
    const data = document.getElementById('eventoData').value;
    const horario = document.getElementById('eventoHorario').value;
    const tipo = document.getElementById('eventoTipo').value;
    const titulo = document.getElementById('eventoTitulo').value;
    const ticket = document.getElementById('eventoTicket').value.trim();
    const municipio = document.getElementById('eventoMunicipio').value.trim();
    const responsavelId = document.getElementById('eventoResponsavel').value;
    const participantes = document.getElementById('eventoParticipantes').value;
    const duracao = parseInt(document.getElementById('eventoDuracao').value) || 60;
    const descricao = document.getElementById('eventoDescricao').value;
    const local = document.getElementById('eventoLocal').value;

    if (!data || !horario || !tipo || !titulo) {
        alert('Preencha os campos obrigatórios: Data, Horário, Tipo e Título.');
        return;
    }

    if (!responsavelId) {
        alert('Selecione um colaborador responsável para este evento.');
        return;
    }

    if (colaboradorEstaDeFerias(responsavelId)) {
        if (!confirm('⚠️ Este colaborador está em férias. Deseja continuar mesmo assim?')) {
            return;
        }
    }

    const colaborador = colaboradoresCache.find(c => c.id === responsavelId);
    if (!colaborador) {
        alert('Colaborador selecionado não encontrado.');
        return;
    }

    if (colaborador.ativo === false) {
        alert('Este colaborador está inativo. Por favor, selecione um colaborador ativo.');
        return;
    }

    const podeContinuar = await verificarDemandaAntesDeSalvar(
        responsavelId,
        colaborador.nome,
        data,
        duracao
    );

    if (!podeContinuar) {
        return;
    }

    try {
        const [ano, mes, dia] = data.split('-').map(Number);
        const [hora, minuto] = horario.split(':').map(Number);
        
        const dataEvento = new Date(Date.UTC(ano, mes - 1, dia, hora, minuto, 0));
        const dataISO = dataEvento.toISOString();

        await db.collection('eventosAgenda').add({
            data: dataISO,
            tipo: tipo,
            titulo: titulo,
            ticket: ticket || '',
            municipio: municipio || '',
            responsavelId: responsavelId,
            responsavelNome: colaborador.nome,
            responsavelEmail: colaborador.email,
            responsavelCargo: colaborador.cargo || '',
            participantes: parseInt(participantes) || 1,
            duracao: duracao,
            descricao: descricao || '',
            local: local || '',
            status: 'designado',
            criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
            criadoPor: currentUser.uid,
            criadoPorNome: currentUser.nome
        });

        alert('✅ Evento adicionado à agenda com sucesso!');

        document.getElementById('eventoData').value = '';
        document.getElementById('eventoHorario').value = '';
        document.getElementById('eventoTitulo').value = '';
        document.getElementById('eventoTicket').value = '';
        document.getElementById('eventoMunicipio').value = '';
        document.getElementById('eventoParticipantes').value = 1;
        document.getElementById('eventoDuracao').value = 60;
        document.getElementById('eventoDescricao').value = '';
        document.getElementById('eventoLocal').value = '';
        document.getElementById('eventoResponsavel').value = '';

    } catch (error) {
        console.error("Erro ao adicionar evento:", error);
        alert('Erro ao adicionar: ' + error.message);
    }
}

// ==================== EDIÇÃO DE EVENTOS ====================
function editarEvento(id) {
    fecharEdicao();
    
    eventoEmEdicao = id;
    
    db.collection('eventosAgenda').doc(id).get()
        .then(doc => {
            if (!doc.exists) {
                alert('Evento não encontrado!');
                return;
            }
            
            const evento = doc.data();
            const dataEvento = new Date(evento.data);
            const dataStr = dataEvento.toISOString().split('T')[0];
            const horaStr = dataEvento.toTimeString().slice(0, 5);
            
            const card = document.getElementById(`card-evento-${id}`);
            if (!card) return;
            
            const content = card.querySelector('.card-content');
            if (content) content.style.display = 'none';
            
            const editContainer = document.createElement('div');
            editContainer.className = 'edit-form-container active';
            editContainer.id = `edit-form-${id}`;
            editContainer.innerHTML = `
                <h4 style="margin-bottom: 16px; color: #0f172a; display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-edit" style="color: #f59e0b;"></i> 
                    Editando: ${evento.titulo}
                </h4>
                <div class="form-row">
                    <div class="form-group">
                        <label><i class="fas fa-calendar-day"></i> Data *</label>
                        <input type="date" id="edit-data-${id}" value="${dataStr}" required>
                    </div>
                    <div class="form-group">
                        <label><i class="fas fa-clock"></i> Horário *</label>
                        <input type="time" id="edit-horario-${id}" value="${horaStr}" required>
                    </div>
                </div>
                <div class="form-group">
                    <label><i class="fas fa-tag"></i> Tipo *</label>
                    <select id="edit-tipo-${id}" required>
                        <option value="reuniao" ${evento.tipo === 'reuniao' ? 'selected' : ''}>📋 Reunião</option>
                        <option value="reuniao_gestor" ${evento.tipo === 'reuniao_gestor' ? 'selected' : ''}>👔 Reunião com Gestor</option>
                        <option value="treinamento" ${evento.tipo === 'treinamento' ? 'selected' : ''}>🎓 Treinamento</option>
                        <option value="treinamento_interno" ${evento.tipo === 'treinamento_interno' ? 'selected' : ''}>🏢 Treinamento Interno</option>
                        <option value="suporte" ${evento.tipo === 'suporte' ? 'selected' : ''}>🛠️ Suporte Técnico</option>
                        <option value="demonstracao" ${evento.tipo === 'demonstracao' ? 'selected' : ''}>📊 Demonstração</option>
                        <option value="outro" ${evento.tipo === 'outro' ? 'selected' : ''}>📌 Outro</option>
                    </select>
                </div>
                <div class="form-group">
                    <label><i class="fas fa-comment"></i> Título / Assunto *</label>
                    <input type="text" id="edit-titulo-${id}" value="${evento.titulo}" placeholder="Ex: Treinamento de Equipe" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label><i class="fas fa-ticket-alt"></i> Número do Ticket</label>
                        <input type="text" id="edit-ticket-${id}" value="${evento.ticket || ''}" placeholder="Ex: #12345, NX-2024-001">
                    </div>
                    <div class="form-group">
                        <label><i class="fas fa-city"></i> Município</label>
                        <input type="text" id="edit-municipio-${id}" value="${evento.municipio || ''}" placeholder="Ex: João Pessoa, Campina Grande">
                    </div>
                </div>
                <div class="form-group">
                    <label><i class="fas fa-user-tie"></i> Responsável *</label>
                    <select id="edit-responsavel-${id}" required>
                        <option value="">Selecione um colaborador...</option>
                        ${colaboradoresCache.filter(c => c.ativo !== false).map(c => `
                            <option value="${c.id}" ${c.id === evento.responsavelId ? 'selected' : ''}>
                                ${c.nome} ${c.cargo ? ' - ' + c.cargo : ''}
                                ${colaboradorEstaDeFerias(c.id) ? ' 🏖️' : ''}
                            </option>
                        `).join('')}
                    </select>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label><i class="fas fa-users"></i> Participantes</label>
                        <input type="number" id="edit-participantes-${id}" value="${evento.participantes || 1}" min="1">
                    </div>
                    <div class="form-group">
                        <label><i class="fas fa-clock"></i> Duração (minutos)</label>
                        <input type="number" id="edit-duracao-${id}" value="${evento.duracao || 60}" min="15" step="5">
                    </div>
                </div>
                <div class="form-group">
                    <label><i class="fas fa-info-circle"></i> Descrição</label>
                    <textarea id="edit-descricao-${id}" rows="3" placeholder="Detalhes sobre o evento...">${evento.descricao || ''}</textarea>
                </div>
                <div class="form-group">
                    <label><i class="fas fa-map-marker-alt"></i> Local</label>
                    <input type="text" id="edit-local-${id}" value="${evento.local || ''}" placeholder="Sala, endereço ou link (ex: Zoom, Meet)">
                </div>
                <div class="edit-actions">
                    <button class="btn-edit-save" onclick="salvarEdicao('${id}')">
                        <i class="fas fa-save"></i> Salvar Alterações
                    </button>
                    <button class="btn-edit-cancel" onclick="fecharEdicao()">
                        <i class="fas fa-times"></i> Cancelar
                    </button>
                </div>
            `;
            
            card.appendChild(editContainer);
            
        })
        .catch(error => {
            console.error("Erro ao carregar evento para edição:", error);
            alert('Erro ao carregar dados do evento: ' + error.message);
        });
}

async function salvarEdicao(id) {
    const data = document.getElementById(`edit-data-${id}`).value;
    const horario = document.getElementById(`edit-horario-${id}`).value;
    const tipo = document.getElementById(`edit-tipo-${id}`).value;
    const titulo = document.getElementById(`edit-titulo-${id}`).value;
    const ticket = document.getElementById(`edit-ticket-${id}`).value.trim();
    const municipio = document.getElementById(`edit-municipio-${id}`).value.trim();
    const responsavelId = document.getElementById(`edit-responsavel-${id}`).value;
    const participantes = document.getElementById(`edit-participantes-${id}`).value;
    const duracao = parseInt(document.getElementById(`edit-duracao-${id}`).value) || 60;
    const descricao = document.getElementById(`edit-descricao-${id}`).value;
    const local = document.getElementById(`edit-local-${id}`).value;

    if (!data || !horario || !tipo || !titulo) {
        alert('Preencha os campos obrigatórios: Data, Horário, Tipo e Título.');
        return;
    }

    if (!responsavelId) {
        alert('Selecione um colaborador responsável para este evento.');
        return;
    }

    if (colaboradorEstaDeFerias(responsavelId)) {
        if (!confirm('⚠️ Este colaborador está em férias. Deseja continuar mesmo assim?')) {
            return;
        }
    }

    const colaborador = colaboradoresCache.find(c => c.id === responsavelId);
    if (!colaborador) {
        alert('Colaborador selecionado não encontrado.');
        return;
    }

    if (colaborador.ativo === false) {
        alert('Este colaborador está inativo. Por favor, selecione um colaborador ativo.');
        return;
    }

    const podeContinuar = await verificarDemandaAntesDeSalvar(
        responsavelId,
        colaborador.nome,
        data,
        duracao
    );

    if (!podeContinuar) {
        return;
    }

    if (!confirm('Tem certeza que deseja salvar as alterações deste evento?')) {
        return;
    }

    try {
        const [ano, mes, dia] = data.split('-').map(Number);
        const [hora, minuto] = horario.split(':').map(Number);
        
        const dataEvento = new Date(Date.UTC(ano, mes - 1, dia, hora, minuto, 0));
        const dataISO = dataEvento.toISOString();
        
        await db.collection('eventosAgenda').doc(id).update({
            data: dataISO,
            tipo: tipo,
            titulo: titulo,
            ticket: ticket || '',
            municipio: municipio || '',
            responsavelId: responsavelId,
            responsavelNome: colaborador.nome,
            responsavelEmail: colaborador.email,
            responsavelCargo: colaborador.cargo || '',
            participantes: parseInt(participantes) || 1,
            duracao: duracao,
            descricao: descricao || '',
            local: local || '',
            atualizadoEm: firebase.firestore.FieldValue.serverTimestamp(),
            atualizadoPor: currentUser.uid,
            atualizadoPorNome: currentUser.nome
        });

        alert('✅ Evento atualizado com sucesso!');
        fecharEdicao();

    } catch (error) {
        console.error("Erro ao salvar edição:", error);
        alert('Erro ao salvar: ' + error.message);
    }
}

function fecharEdicao() {
    document.querySelectorAll('.edit-form-container').forEach(el => el.remove());
    document.querySelectorAll('.card-content').forEach(el => el.style.display = 'block');
    eventoEmEdicao = null;
}

// ==================== EXCLUIR EVENTOS ====================
function excluirEvento(id) {
    eventoParaExcluir = { id, tipo: 'evento' };
    abrirModal(
        'Tem certeza que deseja excluir este evento da agenda? Esta ação não pode ser desfeita.',
        excluirEventoConfirmado,
        'danger'
    );
}

async function excluirEventoConfirmado() {
    if (!eventoParaExcluir || eventoParaExcluir.tipo !== 'evento') {
        console.error("Nenhum evento para excluir");
        return;
    }
    
    try {
        await db.collection('eventosAgenda').doc(eventoParaExcluir.id).delete();
        alert('✅ Evento excluído com sucesso!');
    } catch (error) {
        console.error("Erro ao excluir evento:", error);
        alert('❌ Erro ao excluir: ' + error.message);
    } finally {
        eventoParaExcluir = null;
    }
}

// ==================== CONFIGURAÇÕES ====================
async function salvarConfiguracoes() {
    const diasSelecionados = Array.from(document.querySelectorAll('.dias-check input:checked'))
        .map(cb => parseInt(cb.value));
    
    try {
        await db.collection('configuracoes').doc('geral').set({
            diasUteis: diasSelecionados,
            horaInicio: document.getElementById('horaInicio').value,
            horaFim: document.getElementById('horaFim').value,
            duracao: parseInt(document.getElementById('duracao').value),
            atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert('✅ Configurações salvas com sucesso!');
    } catch (error) {
        alert('Erro ao salvar: ' + error.message);
    }
}

// ==================== SIDEBAR ====================
function iniciarSidebar() {
    document.querySelectorAll('.sidebar li').forEach(item => {
        item.removeEventListener('click', sidebarClickHandler);
        item.addEventListener('click', sidebarClickHandler);
    });
}

function sidebarClickHandler() {
    document.querySelectorAll('.sidebar li').forEach(li => li.classList.remove('active'));
    this.classList.add('active');
    const sectionId = this.dataset.section + 'Section';
    
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        
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
    }
}

// ==================== DASHBOARD ====================
function atualizarDashboard(snapshot) {
    const eventos = [];
    snapshot.forEach(doc => {
        eventos.push({ id: doc.id, ...doc.data() });
    });

    const eventosFiltrados = filtrarEventosPorPeriodo(eventos);
    
    atualizarDashboardStats(eventosFiltrados);
    atualizarProximosEventos(eventosFiltrados);
    atualizarGraficoTipos(eventosFiltrados);
    
    const periodoInfo = document.getElementById('periodoInfo');
    if (periodoInfo) {
        const labels = {
            'todos': 'Mostrando todos os eventos',
            'hoje': '🔥 Mostrando eventos de hoje',
            'semana': '📆 Mostrando eventos desta semana',
            'mes': '📆 Mostrando eventos deste mês'
        };
        periodoInfo.textContent = labels[filtroPeriodo] || labels['todos'];
        periodoInfo.className = filtroPeriodo !== 'todos' ? 'destaque' : '';
    }
}

function filtrarEventosPorPeriodo(eventos) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    if (filtroPeriodo === 'todos') {
        return eventos;
    }
    
    if (filtroPeriodo === 'hoje') {
        return eventos.filter(e => {
            const dataEvento = new Date(e.data);
            dataEvento.setHours(0, 0, 0, 0);
            return dataEvento.getTime() === hoje.getTime();
        });
    }
    
    if (filtroPeriodo === 'semana') {
        const diaSemana = hoje.getDay();
        const diff = diaSemana === 0 ? 6 : diaSemana - 1;
        const inicioSemana = new Date(hoje);
        inicioSemana.setDate(hoje.getDate() - diff);
        inicioSemana.setHours(0, 0, 0, 0);
        
        const fimSemana = new Date(inicioSemana);
        fimSemana.setDate(inicioSemana.getDate() + 6);
        fimSemana.setHours(23, 59, 59, 999);
        
        return eventos.filter(e => {
            const dataEvento = new Date(e.data);
            return dataEvento >= inicioSemana && dataEvento <= fimSemana;
        });
    }
    
    if (filtroPeriodo === 'mes') {
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
        fimMes.setHours(23, 59, 59, 999);
        
        return eventos.filter(e => {
            const dataEvento = new Date(e.data);
            return dataEvento >= inicioMes && dataEvento <= fimMes;
        });
    }
    
    return eventos;
}

function atualizarDashboardStats(eventos) {
    const total = eventos.length;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const eventosHoje = eventos.filter(e => {
        const dataEvento = new Date(e.data);
        dataEvento.setHours(0, 0, 0, 0);
        return dataEvento.getTime() === hoje.getTime();
    });
    
    const eventosFuturos = eventos.filter(e => {
        const dataEvento = new Date(e.data);
        dataEvento.setHours(0, 0, 0, 0);
        return dataEvento.getTime() > hoje.getTime();
    });

    const eventosPassados = eventos.filter(e => {
        const dataEvento = new Date(e.data);
        dataEvento.setHours(0, 0, 0, 0);
        return dataEvento.getTime() < hoje.getTime();
    });

    const tiposCount = {};
    eventos.forEach(e => {
        const label = TIPO_LABELS[e.tipo] || e.tipo;
        tiposCount[label] = (tiposCount[label] || 0) + 1;
    });

    document.getElementById('statTotal').textContent = total;
    document.getElementById('statHoje').textContent = eventosHoje.length;
    document.getElementById('statFuturos').textContent = eventosFuturos.length;
    document.getElementById('statPassados').textContent = eventosPassados.length;
    document.getElementById('statTipos').textContent = Object.keys(tiposCount).length;
}

function atualizarProximosEventos(eventos) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const proximosContainer = document.getElementById('proximosEventosLista');
    if (!proximosContainer) return;

    const proximos = eventos
        .filter(e => {
            const dataEvento = new Date(e.data);
            dataEvento.setHours(0, 0, 0, 0);
            return dataEvento.getTime() >= hoje.getTime();
        })
        .sort((a, b) => new Date(a.data) - new Date(b.data))
        .slice(0, 10);

    if (proximos.length === 0) {
        proximosContainer.innerHTML = `
            <div class="empty-events">
                <i class="fas fa-calendar-check"></i>
                <span>Nenhum evento agendado para este período</span>
            </div>
        `;
    } else {
        proximosContainer.innerHTML = '';
        proximos.forEach(e => {
            const dataEvento = new Date(e.data);
            const dataStr = formatarDataParaExibicao(e.data);
            const horaStr = extrairHoraParaExibicao(e.data);
            
            const isHoje = dataEvento.getDate() === hoje.getDate() &&
                           dataEvento.getMonth() === hoje.getMonth() &&
                           dataEvento.getFullYear() === hoje.getFullYear();

            const amanha = new Date(hoje);
            amanha.setDate(hoje.getDate() + 1);
            const isAmanha = dataEvento.getDate() === amanha.getDate() &&
                             dataEvento.getMonth() === amanha.getMonth() &&
                             dataEvento.getFullYear() === amanha.getFullYear();

            let labelData = dataStr;
            if (isHoje) labelData = '🔥 Hoje';
            else if (isAmanha) labelData = '📅 Amanhã';

            const item = document.createElement('div');
            item.className = 'evento-item';
            item.innerHTML = `
                <div class="evento-info">
                    <span class="evento-badge" style="background: ${TIPO_BORDER_COLORS[e.tipo] || '#2563eb'};"></span>
                    <div>
                        <div class="evento-nome">${e.titulo}</div>
                        <div class="evento-detalhe">${TIPO_LABELS[e.tipo] || e.tipo} · ${e.responsavelNome || 'Não definido'}</div>
                    </div>
                </div>
                <div class="evento-data">
                    ${labelData} ${horaStr !== '--:--' ? '· ' + horaStr : ''}
                </div>
            `;
            proximosContainer.appendChild(item);
        });
    }
}

function atualizarGraficoTipos(eventos) {
    const tiposCount = {};
    eventos.forEach(e => {
        const label = TIPO_LABELS[e.tipo] || e.tipo;
        tiposCount[label] = (tiposCount[label] || 0) + 1;
    });

    const tiposOrdenados = Object.entries(tiposCount)
        .sort((a, b) => b[1] - a[1]);

    const maxCount = tiposOrdenados.length > 0 ? tiposOrdenados[0][1] : 1;
    const chartContainer = document.getElementById('tipoChartContainer');
    if (chartContainer) {
        chartContainer.innerHTML = '';
        tiposOrdenados.forEach(([label, count]) => {
            const percent = Math.round((count / maxCount) * 100);
            const cores = {
                '📋 Reunião': '#2563eb',
                '👔 Reunião com Gestor': '#7c3aed',
                '🎓 Treinamento': '#059669',
                '🏢 Treinamento Interno': '#d97706',
                '🛠️ Suporte Técnico': '#d97706',
                '📊 Demonstração': '#4338ca',
                '📌 Outro': '#475569'
            };
            const cor = cores[label] || '#2563eb';
            chartContainer.innerHTML += `
                <div class="tipo-item">
                    <span>${label}</span>
                    <span style="font-weight: 600; color: #0f172a; min-width: 20px;">${count}</span>
                    <div class="tipo-bar">
                        <div class="tipo-fill" style="width: ${percent}%; background: ${cor};"></div>
                    </div>
                </div>
            `;
        });

        if (tiposOrdenados.length === 0) {
            chartContainer.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #94a3b8; width: 100%;">
                    <i class="fas fa-chart-pie" style="font-size: 32px; display: block; margin-bottom: 8px;"></i>
                    Nenhum evento neste período
                </div>
            `;
        }
    }
}

function iniciarDashboard() {
    if (unsubscribeDashboard) {
        unsubscribeDashboard();
    }

    try {
        unsubscribeDashboard = db.collection('eventosAgenda')
            .orderBy('data', 'asc')
            .onSnapshot((snapshot) => {
                console.log("📊 Dashboard atualizado em tempo real!");
                atualizarDashboard(snapshot);
            }, (error) => {
                console.error("❌ Erro no dashboard:", error);
                const container = document.getElementById('proximosEventosLista');
                if (container) {
                    container.innerHTML = `
                        <div class="empty-events" style="color: #ef4444;">
                            <i class="fas fa-exclamation-triangle" style="color: #ef4444;"></i>
                            <span>Erro ao carregar dados: ${error.message}</span>
                        </div>
                    `;
                }
            });
    } catch (error) {
        console.error("❌ Erro ao iniciar dashboard:", error);
    }
}

function renderizarDashboard() {
    if (document.querySelector('.dashboard-stats')) {
        return;
    }

    if (!unsubscribeDashboard) {
        iniciarDashboard();
    }
}

// ==================== FILTROS POR PERÍODO ====================
function filtrarPorPeriodo(periodo) {
    filtroPeriodo = periodo;
    
    document.querySelectorAll('.periodo-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.periodo === periodo) {
            btn.classList.add('active');
        }
    });
    
    db.collection('eventosAgenda')
        .orderBy('data', 'asc')
        .get()
        .then((snapshot) => {
            atualizarDashboard(snapshot);
        })
        .catch(error => {
            console.error("Erro ao buscar eventos:", error);
        });
}

// ==================== FUNÇÕES AUXILIARES ====================
function formatarDataParaExibicao(dataISO) {
    if (!dataISO) return 'Data não definida';
    const partes = dataISO.split('T')[0].split('-');
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function formatarDataParaExibicaoSimples(data) {
    if (!data) return 'Data não definida';
    const partes = data.split('-');
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function extrairHoraParaExibicao(dataISO) {
    if (!dataISO) return '--:--';
    const horaParte = dataISO.split('T')[1];
    if (!horaParte) return '--:--';
    return horaParte.substring(0, 5);
}

// ==================== CORRIGIR DATAS ====================
async function corrigirDatasEventos() {
    console.log("🔧 Corrigindo datas dos eventos existentes...");
    
    if (!confirm('⚠️ Esta ação irá corrigir as datas de todos os eventos existentes para o formato UTC. Deseja continuar?')) {
        return;
    }
    
    try {
        const snap = await db.collection('eventosAgenda').get();
        let corrigidos = 0;
        let erros = 0;
        
        for (const doc of snap.docs) {
            const data = doc.data();
            const dataOriginal = data.data;
            
            if (dataOriginal) {
                try {
                    if (typeof dataOriginal === 'string') {
                        if (dataOriginal.includes('T')) {
                            const dataObj = new Date(dataOriginal);
                            if (!isNaN(dataObj.getTime())) {
                                const ano = dataObj.getUTCFullYear();
                                const mes = String(dataObj.getUTCMonth() + 1).padStart(2, '0');
                                const dia = String(dataObj.getUTCDate()).padStart(2, '0');
                                const hora = String(dataObj.getUTCHours()).padStart(2, '0');
                                const minuto = String(dataObj.getUTCMinutes()).padStart(2, '0');
                                const dataCorrigida = `${ano}-${mes}-${dia}T${hora}:${minuto}:00.000Z`;
                                
                                if (dataOriginal !== dataCorrigida) {
                                    await db.collection('eventosAgenda').doc(doc.id).update({
                                        data: dataCorrigida
                                    });
                                    corrigidos++;
                                    console.log(`✅ Corrigido: "${data.titulo}" - ${dataOriginal} -> ${dataCorrigida}`);
                                }
                            }
                        } else {
                            const dataObj = new Date(dataOriginal + 'T00:00:00Z');
                            if (!isNaN(dataObj.getTime())) {
                                const dataCorrigida = dataObj.toISOString();
                                await db.collection('eventosAgenda').doc(doc.id).update({
                                    data: dataCorrigida
                                });
                                corrigidos++;
                                console.log(`✅ Corrigido: "${data.titulo}" - ${dataOriginal} -> ${dataCorrigida}`);
                            }
                        }
                    }
                } catch (e) {
                    erros++;
                    console.error(`❌ Erro ao corrigir evento "${data.titulo}":`, e);
                }
            }
        }
        
        console.log(`✅ ${corrigidos} eventos corrigidos! ${erros} erros.`);
        alert(`✅ ${corrigidos} eventos corrigidos!\n${erros} erros encontrados.`);
        
        if (corrigidos > 0) {
            alert('Recarregue a página para ver as alterações.');
        }
        
    } catch (error) {
        console.error("❌ Erro ao corrigir datas:", error);
        alert("❌ Erro ao corrigir datas: " + error.message);
    }
}

// ==================== CRIAÇÃO DE ADMIN ====================
async function criarAdminInicial() {
    const email = prompt('Digite o e-mail do administrador:');
    const senha = prompt('Digite a senha (mínimo 6 caracteres):');
    const nome = prompt('Digite o nome completo:');

    if (!email || !senha || !nome) {
        alert('Todos os campos são obrigatórios!');
        return;
    }

    if (senha.length < 6) {
        alert('A senha deve ter pelo menos 6 caracteres.');
        return;
    }

    try {
        const userCred = await auth.createUserWithEmailAndPassword(email, senha);
        
        await db.collection('usuarios').doc(userCred.user.uid).set({
            uid: userCred.user.uid,
            nome: nome,
            email: email,
            tipo: 'admin',
            aprovado: true,
            criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
            criadoPor: 'sistema'
        });

        alert(`✅ Administrador criado com sucesso!\n\n📧 Email: ${email}\n🔑 Senha: ${senha}\n👤 Nome: ${nome}\n\nAgora faça login na página principal.`);
    } catch (error) {
        console.error("Erro ao criar admin:", error);
        if (error.code === 'auth/email-already-in-use') {
            alert('Este e-mail já está em uso. Tente outro e-mail.');
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

// ==================== RESERVAS DE SALAS ====================

function iniciarListenerReservas() {
    if (unsubscribeReservas) {
        unsubscribeReservas();
    }

    try {
        unsubscribeReservas = db.collection('reservasSalas')
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

        const card = document.createElement('div');
        card.className = 'card';
        card.id = `card-reserva-${r.id}`;
        card.style.borderLeft = `4px solid ${isPassado && r.status !== 'cancelada' ? '#94a3b8' : '#2563eb'}`;

        const temConflito = verificarConflitoReserva(r);

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

function verificarConflitoReserva(reserva) {
    return reservasCache.some(r => {
        if (r.id === reserva.id) return false;
        if (r.status === 'cancelada') return false;
        if (r.sala !== reserva.sala) return false;
        if (r.data !== reserva.data) return false;
        
        const rInicio = r.horario ? r.horario.split(':').map(Number) : [0, 0];
        const rFim = r.duracao ? addMinutes(r.horario, r.duracao) : r.horario;
        const reservaInicio = reserva.horario ? reserva.horario.split(':').map(Number) : [0, 0];
        const reservaFim = reserva.duracao ? addMinutes(reserva.horario, reserva.duracao) : reserva.horario;
        
        const rStart = rInicio[0] * 60 + rInicio[1];
        const rEnd = rFim ? rFim.split(':').map(Number) : rInicio;
        const rEndMinutes = rEnd[0] * 60 + rEnd[1];
        const reservaStart = reservaInicio[0] * 60 + reservaInicio[1];
        const reservaEnd = reservaFim ? reservaFim.split(':').map(Number) : reservaInicio;
        const reservaEndMinutes = reservaEnd[0] * 60 + reservaEnd[1];
        
        return (reservaStart < rEndMinutes && reservaEndMinutes > rStart);
    });
}

function addMinutes(time, minutes) {
    if (!time) return time;
    const [h, m] = time.split(':').map(Number);
    const total = h * 60 + m + minutes;
    const newH = Math.floor(total / 60);
    const newM = total % 60;
    return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
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
        }
    } else {
        titulo.textContent = '📋 Nova Reserva de Sala';
        document.getElementById('reservaId').value = '';
        document.getElementById('reservaSala').value = '';
        document.getElementById('reservaCapacidade').value = 0;
        document.getElementById('reservaData').value = '';
        document.getElementById('reservaHorario').value = '';
        document.getElementById('reservaDuracao').value = 60;
        document.getElementById('reservaResponsavel').value = '';
        document.getElementById('reservaTitulo').value = '';
        document.getElementById('reservaDescricao').value = '';
        document.getElementById('reservaStatus').value = 'pendente';
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

async function salvarReserva() {
    const id = document.getElementById('reservaId').value;
    const sala = document.getElementById('reservaSala').value;
    const capacidade = parseInt(document.getElementById('reservaCapacidade').value) || 1;
    const data = document.getElementById('reservaData').value;
    const horario = document.getElementById('reservaHorario').value;
    const duracao = parseInt(document.getElementById('reservaDuracao').value) || 60;
    const responsavelId = document.getElementById('reservaResponsavel').value;
    const titulo = document.getElementById('reservaTitulo').value.trim();
    const descricao = document.getElementById('reservaDescricao').value.trim();
    const status = document.getElementById('reservaStatus').value;

    if (!sala || !data || !horario || !responsavelId || !titulo) {
        alert('❌ Preencha todos os campos obrigatórios: Sala, Data, Horário, Responsável e Título.');
        return;
    }

    const colaborador = colaboradoresCache.find(c => c.id === responsavelId);
    if (!colaborador) {
        alert('❌ Colaborador não encontrado!');
        return;
    }

    if (colaborador.ativo === false) {
        alert('❌ Este colaborador está inativo. Selecione um colaborador ativo.');
        return;
    }

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

    try {
        const dados = {
            sala: sala,
            capacidade: capacidade || SALAS_CAPACIDADE[sala] || 0,
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

// ==================== EXPOR FUNÇÕES GLOBAIS ====================
window.criarAdminInicial = criarAdminInicial;
window.trocarAba = trocarAba;
window.criarContaAdmin = criarContaAdmin;
window.verificarAdminExistente = verificarAdminExistente;
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

// ==================== EXECUTAR VERIFICAÇÃO AO CARREGAR ====================
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(verificarAdminExistente, 1000);
});