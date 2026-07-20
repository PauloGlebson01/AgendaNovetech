// admin-approval.js
// ==================== GESTÃO DE APROVAÇÃO DE USUÁRIOS ====================

// Coleção para armazenar solicitações de cadastro
const SOLICITACOES_COLLECTION = 'solicitacoesCadastro';

// ==================== FUNÇÃO PARA SOLICITAR CADASTRO (CORRIGIDA) ====================
async function solicitarCadastroAdmin() {
    const nome = document.getElementById('criarNome').value.trim();
    const email = document.getElementById('criarEmail').value.trim();
    const senha = document.getElementById('criarSenha').value;
    const senhaConfirm = document.getElementById('criarSenhaConfirm').value;
    const telefone = document.getElementById('criarTelefone')?.value?.trim() || '';
    const empresa = document.getElementById('criarEmpresa')?.value?.trim() || '';
    const cargo = document.getElementById('criarCargo')?.value?.trim() || '';
    const motivo = document.getElementById('criarMotivo')?.value?.trim() || '';

    // Validações
    if (!nome || !email || !senha || !senhaConfirm) {
        mostrarNotificacao('❌ Preencha todos os campos obrigatórios.', 'error');
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        mostrarNotificacao('❌ Por favor, insira um e-mail válido.', 'error');
        return;
    }

    if (senha.length < 6) {
        mostrarNotificacao('❌ A senha deve ter pelo menos 6 caracteres.', 'error');
        return;
    }

    if (senha !== senhaConfirm) {
        mostrarNotificacao('❌ As senhas não coincidem.', 'error');
        return;
    }

    const btn = document.querySelector('#criarTab .btn-primary');
    if (!btn) return;
    
    const textoOriginal = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando solicitação...';

    try {
        // Verificar se já existe solicitação pendente para este e-mail
        const existing = await db.collection(SOLICITACOES_COLLECTION)
            .where('email', '==', email)
            .where('status', '==', 'pendente')
            .get()
            .catch(() => ({ empty: true }));

        if (!existing.empty) {
            mostrarNotificacao('⚠️ Você já possui uma solicitação pendente. Aguarde a aprovação do administrador.', 'warning');
            btn.disabled = false;
            btn.innerHTML = textoOriginal;
            return;
        }

        // Verificar se já é um usuário aprovado
        const userSnapshot = await db.collection('usuarios')
            .where('email', '==', email)
            .get()
            .catch(() => ({ empty: true }));

        if (!userSnapshot.empty) {
            mostrarNotificacao('⚠️ Este e-mail já está cadastrado no sistema. Faça login ou solicite recuperação de senha.', 'warning');
            btn.disabled = false;
            btn.innerHTML = textoOriginal;
            return;
        }

        // 🔥 PASSO 1: CRIAR USUÁRIO NO AUTH PRIMEIRO (obter UID real)
        let uid = null;
        try {
            const userCred = await auth.createUserWithEmailAndPassword(email, senha);
            uid = userCred.user.uid;
            console.log(`✅ Usuário criado no Auth com UID: ${uid}`);
            
            // 🔥 DESLOGAR IMEDIATAMENTE
            await auth.signOut();
        } catch (authError) {
            if (authError.code === 'auth/email-already-in-use') {
                // Se o e-mail já existe no Auth, tentamos encontrar o UID
                try {
                    const userCred = await auth.signInWithEmailAndPassword(email, senha);
                    uid = userCred.user.uid;
                    await auth.signOut();
                    console.log(`✅ Usuário já existia no Auth, UID: ${uid}`);
                } catch (loginError) {
                    mostrarNotificacao('❌ Este e-mail já está em uso. Tente outro e-mail ou faça login.', 'error');
                    btn.disabled = false;
                    btn.innerHTML = textoOriginal;
                    return;
                }
            } else {
                throw authError;
            }
        }

        if (!uid) {
            mostrarNotificacao('❌ Erro ao criar usuário: UID não obtido.', 'error');
            btn.disabled = false;
            btn.innerHTML = textoOriginal;
            return;
        }

        // 🔥 PASSO 2: SALVAR SOLICITAÇÃO COM O UID REAL
        await db.collection(SOLICITACOES_COLLECTION).doc(uid).set({
            uid: uid,
            nome: nome,
            email: email,
            telefone: telefone || '',
            empresa: empresa || '',
            cargo: cargo || '',
            motivo: motivo || '',
            status: 'pendente',
            senha: senha,
            criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
            criadoPor: 'anonimo',
            criadoPorNome: nome,
            tipoSolicitado: 'admin'
        });

        // 🔥 PASSO 3: SALVAR USUÁRIO COMO SOLICITANTE
        await db.collection('usuarios').doc(uid).set({
            uid: uid,
            nome: nome,
            email: email,
            tipo: 'solicitante',
            aprovado: false,
            telefone: telefone || '',
            empresa: empresa || '',
            cargo: cargo || '',
            criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
            solicitaAprovacao: true,
            solicitacaoId: uid
        });

        // Restaurar botão
        btn.disabled = false;
        btn.innerHTML = textoOriginal;

        // Limpar formulário
        document.getElementById('criarNome').value = '';
        document.getElementById('criarEmail').value = '';
        document.getElementById('criarSenha').value = '';
        document.getElementById('criarSenhaConfirm').value = '';
        if (document.getElementById('criarTelefone')) document.getElementById('criarTelefone').value = '';
        if (document.getElementById('criarEmpresa')) document.getElementById('criarEmpresa').value = '';
        if (document.getElementById('criarCargo')) document.getElementById('criarCargo').value = '';
        if (document.getElementById('criarMotivo')) document.getElementById('criarMotivo').value = '';

        // Mostrar notificação de sucesso
        mostrarNotificacaoSucessoComRedirecionamento({
            nome: nome,
            email: email
        });

    } catch (error) {
        console.error('❌ Erro ao solicitar cadastro:', error);
        
        btn.disabled = false;
        btn.innerHTML = textoOriginal;
        
        let mensagem = '❌ Erro ao solicitar cadastro: ';
        if (error.code === 'auth/email-already-in-use') {
            mensagem = '❌ Este e-mail já está em uso. Tente outro e-mail ou faça login.';
        } else if (error.code === 'auth/weak-password') {
            mensagem = '❌ A senha é muito fraca. Use pelo menos 6 caracteres.';
        } else if (error.code === 'auth/network-request-failed') {
            mensagem = '❌ Erro de rede. Verifique sua conexão.';
        } else if (error.code === 'auth/too-many-requests') {
            mensagem = '❌ Muitas tentativas. Aguarde um momento e tente novamente.';
        } else if (error.code === 'permission-denied' || (error.message && error.message.includes('Missing or insufficient permissions'))) {
            mensagem = '❌ Erro de permissão no banco de dados.\n\n' +
                      'O administrador precisa configurar as regras de segurança do Firestore.\n\n' +
                      'Solução: Acesse Firebase Console → Firestore → Regras e adicione as regras corretas.';
        } else {
            mensagem += error.message;
        }
        
        mostrarNotificacao(mensagem, 'error');
    }
}

// ==================== NOTIFICAÇÃO DE SUCESSO COM REDIRECIONAMENTO ====================

function mostrarNotificacaoSucessoComRedirecionamento(dados) {
    // Remove notificações anteriores
    const notificacaoExistente = document.querySelector('.custom-notification-success');
    if (notificacaoExistente) {
        notificacaoExistente.remove();
    }

    const notification = document.createElement('div');
    notification.className = 'custom-notification-success';
    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        max-width: 500px;
        width: 92%;
        padding: 40px 32px;
        background: white;
        border-radius: 24px;
        box-shadow: 0 25px 60px rgba(0,0,0,0.3);
        z-index: 10000;
        text-align: center;
        animation: zoomInNotification 0.5s ease;
        font-family: 'Inter', sans-serif;
    `;

    notification.innerHTML = `
        <div style="
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: #d1fae5;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 16px;
            font-size: 40px;
            color: #10b981;
            animation: pulseCheck 1s ease infinite;
        ">
            <i class="fas fa-check-circle"></i>
        </div>
        
        <h2 style="
            font-size: 24px;
            font-weight: 700;
            color: #0f172a;
            margin: 0 0 8px 0;
        ">
            ✅ Solicitação Enviada com Sucesso!
        </h2>
        
        <div style="
            background: #fef3c7;
            border-radius: 12px;
            padding: 16px 20px;
            margin: 16px 0 20px 0;
            border-left: 4px solid #f59e0b;
            text-align: left;
        ">
            <div style="display: flex; align-items: flex-start; gap: 12px;">
                <i class="fas fa-clock" style="color: #d97706; font-size: 20px; margin-top: 2px;"></i>
                <div>
                    <div style="font-weight: 700; color: #78350f; font-size: 16px; margin-bottom: 4px;">
                        ⏳ Seu cadastro está aguardando aprovação
                    </div>
                    <div style="color: #92400e; font-size: 14px; line-height: 1.6;">
                        O administrador irá analisar sua solicitação e você receberá 
                        acesso assim que for aprovado.
                    </div>
                </div>
            </div>
        </div>
        
        <div style="
            background: #f8fafc;
            border-radius: 12px;
            padding: 14px 16px;
            text-align: left;
            margin-bottom: 24px;
            border: 1px solid #e2e8f0;
        ">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px;">
                <i class="fas fa-user" style="color: #2563eb; width: 20px;"></i>
                <span style="font-weight: 500; color: #0f172a;">${dados.nome || 'Usuário'}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-envelope" style="color: #2563eb; width: 20px;"></i>
                <span style="color: #475569;">${dados.email || 'Email não informado'}</span>
            </div>
        </div>
        
        <button onclick="fecharNotificacaoEIrParaLogin()" style="
            width: 100%;
            padding: 14px;
            background: linear-gradient(135deg, #2563eb, #1e40af);
            color: white;
            border: none;
            border-radius: 12px;
            font-weight: 600;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.2s;
            font-family: inherit;
            box-shadow: 0 4px 12px rgba(37,99,235,0.3);
        " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 24px rgba(37,99,235,0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(37,99,235,0.3)'">
            <i class="fas fa-sign-in-alt"></i> Ir para Login
        </button>
        
        <p style="
            margin-top: 12px;
            font-size: 12px;
            color: #94a3b8;
        ">
            Você será redirecionado automaticamente em 5 segundos...
        </p>
    `;

    document.body.appendChild(notification);

    // Adicionar estilos de animação se não existirem
    if (!document.getElementById('notification-animation-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-animation-styles';
        style.textContent = `
            @keyframes zoomInNotification {
                from {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(0.8);
                }
                to {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1);
                }
            }
            @keyframes zoomOutNotification {
                from {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1);
                }
                to {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(0.8);
                }
            }
            @keyframes pulseCheck {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }
        `;
        document.head.appendChild(style);
    }

    // Auto-redirecionar após 5 segundos
    setTimeout(() => {
        fecharNotificacaoEIrParaLogin();
    }, 5000);
}

// ==================== FUNÇÃO PARA FECHAR NOTIFICAÇÃO E IR PARA LOGIN ====================

function fecharNotificacaoEIrParaLogin() {
    // Remove a notificação com animação
    const notification = document.querySelector('.custom-notification-success');
    if (notification) {
        notification.style.animation = 'zoomOutNotification 0.4s ease forwards';
        setTimeout(() => {
            notification.remove();
            // Redirecionar para o login com parâmetro para exibir a mensagem
            window.location.href = 'index.html?msg=aguardando_aprovacao';
        }, 400);
    } else {
        // Se não encontrar a notificação, redireciona direto
        window.location.href = 'index.html?msg=aguardando_aprovacao';
    }
}

// ==================== SISTEMA DE NOTIFICAÇÕES SIMPLES ====================

function mostrarNotificacao(mensagem, tipo = 'info') {
    // Remove notificações anteriores
    const notificacaoExistente = document.querySelector('.custom-notification');
    if (notificacaoExistente) {
        notificacaoExistente.remove();
    }

    const cores = {
        'success': { bg: '#d1fae5', border: '#10b981', text: '#065f46', icon: 'fa-check-circle' },
        'error': { bg: '#fee2e2', border: '#ef4444', text: '#991b1b', icon: 'fa-exclamation-circle' },
        'warning': { bg: '#fef3c7', border: '#f59e0b', text: '#78350f', icon: 'fa-exclamation-triangle' },
        'info': { bg: '#dbeafe', border: '#2563eb', text: '#1e3a5f', icon: 'fa-info-circle' }
    };

    const cor = cores[tipo] || cores['info'];

    const notification = document.createElement('div');
    notification.className = 'custom-notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        max-width: 450px;
        width: 90%;
        padding: 16px 20px;
        background: ${cor.bg};
        border-left: 6px solid ${cor.border};
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.15);
        z-index: 10000;
        display: flex;
        align-items: flex-start;
        gap: 12px;
        animation: slideInNotification 0.5s ease;
        font-family: 'Inter', sans-serif;
        color: ${cor.text};
    `;

    notification.innerHTML = `
        <div style="flex-shrink: 0; font-size: 24px; color: ${cor.border};">
            <i class="fas ${cor.icon}"></i>
        </div>
        <div style="flex: 1; font-size: 14px; line-height: 1.5;">
            ${mensagem}
        </div>
        <button onclick="this.parentElement.remove()" style="
            background: none;
            border: none;
            font-size: 18px;
            cursor: pointer;
            color: ${cor.text};
            opacity: 0.5;
            transition: opacity 0.2s;
            padding: 0 4px;
            flex-shrink: 0;
        " onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.5'">
            <i class="fas fa-times"></i>
        </button>
    `;

    document.body.appendChild(notification);

    // Auto-remover após 6 segundos
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutNotification 0.4s ease forwards';
            setTimeout(() => notification.remove(), 400);
        }
    }, 6000);

    // Adicionar estilos de animação se não existirem
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideInNotification {
                from {
                    opacity: 0;
                    transform: translateX(100px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            @keyframes slideOutNotification {
                from {
                    opacity: 1;
                    transform: translateX(0);
                }
                to {
                    opacity: 0;
                    transform: translateX(100px);
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// ==================== FUNÇÕES PARA ADMIN APROVAR ====================

async function carregarSolicitacoesPendentes() {
    console.log("🔄 Carregando solicitações pendentes...");
    
    try {
        // Verificar se o usuário é admin
        if (!currentUser || currentUser.tipo !== 'admin') {
            console.warn("⚠️ Usuário não é admin, não pode carregar solicitações.");
            const container = document.getElementById('listaSolicitacoes');
            if (container) {
                container.innerHTML = `
                    <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #f59e0b;"></i>
                        <h3 style="margin-top: 12px; color: #475569;">Acesso Restrito</h3>
                        <p style="color: #94a3b8;">Apenas administradores podem ver esta página.</p>
                    </div>
                `;
            }
            return 0;
        }

        const snapshot = await db.collection(SOLICITACOES_COLLECTION)
            .where('status', '==', 'pendente')
            .get();

        console.log(`📊 Encontradas ${snapshot.size} solicitações pendentes`);

        const container = document.getElementById('listaSolicitacoes');
        if (!container) {
            console.warn("⚠️ Elemento 'listaSolicitacoes' não encontrado");
            return 0;
        }

        const solicitacoes = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            solicitacoes.push({ id: doc.id, ...data });
        });

        // Ordenar por data
        solicitacoes.sort((a, b) => {
            const dateA = a.criadoEm?.toDate?.() || new Date(0);
            const dateB = b.criadoEm?.toDate?.() || new Date(0);
            return dateA - dateB;
        });

        if (solicitacoes.length === 0) {
            container.innerHTML = `
                <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                    <i class="fas fa-check-circle" style="font-size: 48px; color: #10b981;"></i>
                    <h3 style="margin-top: 12px; color: #475569;">Nenhuma solicitação pendente</h3>
                    <p style="color: #94a3b8;">Todas as solicitações foram processadas.</p>
                </div>
            `;
            const badge = document.getElementById('solicitacoesBadge');
            if (badge) {
                badge.textContent = '0';
                badge.style.display = 'none';
            }
            return 0;
        }

        container.innerHTML = '';
        solicitacoes.forEach(s => {
            const dataCriacao = s.criadoEm?.toDate?.() || new Date();
            const dataStr = dataCriacao.toLocaleDateString('pt-BR');
            const horaStr = dataCriacao.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

            const card = document.createElement('div');
            card.className = 'card';
            card.style.borderLeft = '4px solid #f59e0b';
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap; gap: 8px;">
                    <div style="flex: 1;">
                        <h3 style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                            <i class="fas fa-user" style="color: #f59e0b;"></i>
                            ${s.nome || 'Usuário'}
                            <span class="status-badge" style="background: #fef3c7; color: #d97706; font-size: 11px; padding: 2px 10px;">
                                ⏳ Pendente
                            </span>
                        </h3>
                        <p><i class="fas fa-envelope" style="color: #64748b;"></i> <strong>${s.email || 'Email não informado'}</strong></p>
                        ${s.telefone ? `<p><i class="fas fa-phone" style="color: #64748b;"></i> ${s.telefone}</p>` : ''}
                        ${s.empresa ? `<p><i class="fas fa-building" style="color: #64748b;"></i> ${s.empresa}</p>` : ''}
                        ${s.cargo ? `<p><i class="fas fa-briefcase" style="color: #64748b;"></i> ${s.cargo}</p>` : ''}
                        ${s.motivo ? `<p style="color: #475569; font-size: 13px; margin-top: 4px; background: #f8fafc; padding: 8px; border-radius: 6px;"><i class="fas fa-info-circle" style="color: #64748b;"></i> ${s.motivo}</p>` : ''}
                        <p style="font-size: 12px; color: #94a3b8; margin-top: 4px;">
                            <i class="fas fa-clock"></i> Solicitado em: ${dataStr} às ${horaStr}
                        </p>
                        <p style="font-size: 10px; color: #94a3b8; word-break: break-all;">
                            <i class="fas fa-id-badge"></i> UID: ${s.uid || 'N/A'}
                        </p>
                    </div>
                </div>
                <div style="margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap;">
                    <button class="btn-sm btn-aprovar" onclick="aprovarSolicitacao('${s.id}')">
                        <i class="fas fa-check"></i> Aprovar
                    </button>
                    <button class="btn-sm btn-rejeitar" onclick="rejeitarSolicitacao('${s.id}', '${s.nome || 'Usuário'}')">
                        <i class="fas fa-times"></i> Rejeitar
                    </button>
                </div>
            `;
            container.appendChild(card);
        });

        const badge = document.getElementById('solicitacoesBadge');
        if (badge) {
            badge.textContent = solicitacoes.length;
            badge.style.display = 'inline-block';
        }

        console.log(`✅ ${solicitacoes.length} solicitações carregadas com sucesso!`);
        return solicitacoes.length;

    } catch (error) {
        console.error('❌ Erro ao carregar solicitações:', error);
        const container = document.getElementById('listaSolicitacoes');
        if (container) {
            container.innerHTML = `
                <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 40px; border-left-color: #ef4444;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #ef4444;"></i>
                    <h3 style="margin-top: 12px; color: #ef4444;">Erro ao carregar solicitações</h3>
                    <p style="color: #64748b; font-size: 14px;">${error.message}</p>
                    <div style="margin-top: 12px; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                        <button onclick="carregarSolicitacoesPendentes()" style="padding: 8px 20px; background: #2563eb; color: white; border: none; border-radius: 8px; cursor: pointer;">
                            <i class="fas fa-redo"></i> Tentar novamente
                        </button>
                    </div>
                </div>
            `;
        }
        return 0;
    }
}

// ==================== APROVAR SOLICITAÇÃO (VERSÃO CORRIGIDA) ====================

async function aprovarSolicitacao(solicitacaoId) {
    if (!confirm('Deseja aprovar esta solicitação? O usuário terá acesso completo ao sistema.')) {
        return;
    }

    try {
        // Buscar a solicitação completa
        const doc = await db.collection(SOLICITACOES_COLLECTION).doc(solicitacaoId).get();
        if (!doc.exists) {
            mostrarNotificacao('❌ Solicitação não encontrada.', 'error');
            return;
        }

        const data = doc.data();
        console.log('📋 Aprovando solicitação:', {
            id: solicitacaoId,
            nome: data.nome,
            email: data.email,
            uid: data.uid
        });
        
        // 🔥 O UID É O ID DO DOCUMENTO (já é o UID real do Auth)
        const userUid = solicitacaoId;
        
        // 🔥 1. ATUALIZAR SOLICITAÇÃO
        await db.collection(SOLICITACOES_COLLECTION).doc(solicitacaoId).update({
            status: 'aprovado',
            aprovadoEm: firebase.firestore.FieldValue.serverTimestamp(),
            aprovadoPor: currentUser.uid,
            aprovadoPorNome: currentUser.nome
        });

        // 🔥 2. ATUALIZAR OU CRIAR USUÁRIO
        const userRef = db.collection('usuarios').doc(userUid);
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) {
            // Criar usuário se não existir
            await userRef.set({
                uid: userUid,
                nome: data.nome,
                email: data.email,
                telefone: data.telefone || '',
                empresa: data.empresa || '',
                cargo: data.cargo || '',
                tipo: 'admin',
                aprovado: true,
                aprovadoEm: firebase.firestore.FieldValue.serverTimestamp(),
                aprovadoPor: currentUser.uid,
                aprovadoPorNome: currentUser.nome,
                criadoEm: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log(`✅ Usuário criado com sucesso: ${userUid}`);
        } else {
            // Atualizar usuário existente
            await userRef.update({
                tipo: 'admin',
                aprovado: true,
                aprovadoEm: firebase.firestore.FieldValue.serverTimestamp(),
                aprovadoPor: currentUser.uid,
                aprovadoPorNome: currentUser.nome
            });
            console.log(`✅ Usuário atualizado com sucesso: ${userUid}`);
        }

        mostrarNotificacao(`✅ Usuário "${data.nome}" aprovado com sucesso!`, 'success');
        await carregarSolicitacoesPendentes();

    } catch (error) {
        console.error('❌ Erro ao aprovar solicitação:', error);
        mostrarNotificacao('❌ Erro ao aprovar: ' + error.message, 'error');
    }
}

// ==================== REJEITAR SOLICITAÇÃO ====================

async function rejeitarSolicitacao(solicitacaoId, nome) {
    const motivo = prompt(`Digite o motivo da rejeição para "${nome}":`, 'Motivo não informado');
    if (motivo === null) return;

    if (!confirm(`Deseja rejeitar a solicitação de "${nome}"?\n\nMotivo: ${motivo}`)) {
        return;
    }

    try {
        const doc = await db.collection(SOLICITACOES_COLLECTION).doc(solicitacaoId).get();
        if (!doc.exists) {
            mostrarNotificacao('❌ Solicitação não encontrada.', 'error');
            return;
        }

        const data = doc.data();

        await db.collection(SOLICITACOES_COLLECTION).doc(solicitacaoId).update({
            status: 'rejeitado',
            motivoRejeicao: motivo,
            rejeitadoEm: firebase.firestore.FieldValue.serverTimestamp(),
            rejeitadoPor: currentUser.uid,
            rejeitadoPorNome: currentUser.nome
        });

        try {
            await db.collection('usuarios').doc(solicitacaoId).update({
                tipo: 'rejeitado',
                aprovado: false,
                motivoRejeicao: motivo,
                rejeitadoEm: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log(`✅ Usuário ${solicitacaoId} marcado como rejeitado`);
        } catch (err) {
            console.warn('⚠️ Usuário não encontrado para atualizar:', err);
        }

        mostrarNotificacao(`✅ Solicitação de "${nome}" rejeitada.`, 'success');
        await carregarSolicitacoesPendentes();

    } catch (error) {
        console.error('❌ Erro ao rejeitar solicitação:', error);
        mostrarNotificacao('❌ Erro ao rejeitar: ' + error.message, 'error');
    }
}

// ==================== VERIFICAR STATUS DO USUÁRIO ====================

async function verificarStatusUsuario(user) {
    if (!user) return null;

    try {
        const userDoc = await db.collection('usuarios').doc(user.uid).get();
        if (!userDoc.exists) {
            await auth.signOut();
            return { status: 'nao_encontrado' };
        }

        const userData = userDoc.data();
        
        if (userData.tipo === 'solicitante' || userData.tipo === 'rejeitado' || userData.aprovado === false) {
            await auth.signOut();
            return { status: userData.tipo };
        }

        return { status: 'aprovado', data: userData };

    } catch (error) {
        console.error('❌ Erro ao verificar status:', error);
        return null;
    }
}

// ==================== INICIALIZAR LISTENER DE SOLICITAÇÕES ====================

let unsubscribeSolicitacoes = null;

function iniciarListenerSolicitacoes() {
    console.log("🔄 Iniciando listener de solicitações...");
    
    if (!currentUser || currentUser.tipo !== 'admin') {
        console.warn("⚠️ Usuário não é admin, não iniciando listener.");
        return;
    }

    if (unsubscribeSolicitacoes) {
        console.log("🔄 Removendo listener anterior...");
        unsubscribeSolicitacoes();
        unsubscribeSolicitacoes = null;
    }

    try {
        unsubscribeSolicitacoes = db.collection(SOLICITACOES_COLLECTION)
            .where('status', '==', 'pendente')
            .onSnapshot((snapshot) => {
                console.log('🔄 Solicitações atualizadas em tempo real!', snapshot.size);
                carregarSolicitacoesPendentes();
            }, (error) => {
                console.error('❌ Erro no listener de solicitações:', error);
            });
        console.log("✅ Listener de solicitações iniciado com sucesso!");
    } catch (error) {
        console.error('❌ Erro ao iniciar listener:', error);
    }
}

// ==================== EXPOR FUNÇÕES ====================

window.solicitarCadastroAdmin = solicitarCadastroAdmin;
window.carregarSolicitacoesPendentes = carregarSolicitacoesPendentes;
window.aprovarSolicitacao = aprovarSolicitacao;
window.rejeitarSolicitacao = rejeitarSolicitacao;
window.verificarStatusUsuario = verificarStatusUsuario;
window.iniciarListenerSolicitacoes = iniciarListenerSolicitacoes;
window.mostrarNotificacao = mostrarNotificacao;
window.mostrarNotificacaoSucessoComRedirecionamento = mostrarNotificacaoSucessoComRedirecionamento;
window.fecharNotificacaoEIrParaLogin = fecharNotificacaoEIrParaLogin;