// admin-approval.js
// ==================== GESTÃO DE APROVAÇÃO DE USUÁRIOS ====================

// Coleção para armazenar solicitações de cadastro
const SOLICITACOES_COLLECTION = 'solicitacoesCadastro';

// ==================== FUNÇÃO PARA SOLICITAR CADASTRO ====================
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
        alert('❌ Preencha todos os campos obrigatórios.');
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('❌ Por favor, insira um e-mail válido.');
        return;
    }

    if (senha.length < 6) {
        alert('❌ A senha deve ter pelo menos 6 caracteres.');
        return;
    }

    if (senha !== senhaConfirm) {
        alert('❌ As senhas não coincidem.');
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
            .get();

        if (!existing.empty) {
            alert('⚠️ Você já possui uma solicitação pendente. Aguarde a aprovação do administrador.');
            btn.disabled = false;
            btn.innerHTML = textoOriginal;
            return;
        }

        // Verificar se já é um usuário aprovado
        const userSnapshot = await db.collection('usuarios')
            .where('email', '==', email)
            .get();

        if (!userSnapshot.empty) {
            alert('⚠️ Este e-mail já está cadastrado no sistema. Faça login ou solicite recuperação de senha.');
            btn.disabled = false;
            btn.innerHTML = textoOriginal;
            return;
        }

        // Criar conta no Firebase Authentication (mas com acesso restrito)
        const userCred = await auth.createUserWithEmailAndPassword(email, senha);
        const uid = userCred.user.uid;

        // Salvar solicitação no Firestore
        await db.collection(SOLICITACOES_COLLECTION).doc(uid).set({
            uid: uid,
            nome: nome,
            email: email,
            telefone: telefone || '',
            empresa: empresa || '',
            cargo: cargo || '',
            motivo: motivo || '',
            status: 'pendente',
            criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
            criadoPor: uid,
            criadoPorNome: nome,
            tipoSolicitado: 'admin'
        });

        // Criar usuário com tipo 'solicitante' (sem acesso)
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
            solicitaAprovacao: true
        });

        alert(`✅ SOLICITAÇÃO ENVIADA COM SUCESSO!\n\n📧 Email: ${email}\n👤 Nome: ${nome}\n\n⏳ Aguarde a aprovação do administrador.\n\n🔒 Seu acesso está restrito até a aprovação.`);

        // Limpar formulário
        document.getElementById('criarNome').value = '';
        document.getElementById('criarEmail').value = '';
        document.getElementById('criarSenha').value = '';
        document.getElementById('criarSenhaConfirm').value = '';
        if (document.getElementById('criarTelefone')) document.getElementById('criarTelefone').value = '';
        if (document.getElementById('criarEmpresa')) document.getElementById('criarEmpresa').value = '';
        if (document.getElementById('criarCargo')) document.getElementById('criarCargo').value = '';
        if (document.getElementById('criarMotivo')) document.getElementById('criarMotivo').value = '';

        // Deslogar usuário (acesso restrito)
        await auth.signOut();

        // Redirecionar para login
        setTimeout(() => {
            window.location.href = 'index.html?msg=solicitacao_enviada';
        }, 3000);

    } catch (error) {
        console.error('❌ Erro ao solicitar cadastro:', error);
        
        if (error.code === 'auth/email-already-in-use') {
            alert('❌ Este e-mail já está em uso. Tente outro e-mail ou faça login.');
        } else if (error.code === 'auth/weak-password') {
            alert('❌ A senha é muito fraca. Use pelo menos 6 caracteres.');
        } else if (error.code === 'auth/network-request-failed') {
            alert('❌ Erro de rede. Verifique sua conexão.');
        } else {
            alert('❌ Erro ao solicitar cadastro: ' + error.message);
        }
    } finally {
        btn.disabled = false;
        btn.innerHTML = textoOriginal;
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

        // Query simplificada - Sem orderBy para evitar erro de índice
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
            console.log(`📌 Solicitação: ${data.nome} (${data.email}) - ${data.status}`);
            solicitacoes.push({ id: doc.id, ...data });
        });

        // Ordenar manualmente por data de criação
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
                    </div>
                </div>
                <div style="margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap;">
                    <button class="btn-sm btn-aprovar" onclick="aprovarSolicitacao('${s.id}', '${s.uid}')">
                        <i class="fas fa-check"></i> Aprovar
                    </button>
                    <button class="btn-sm btn-rejeitar" onclick="rejeitarSolicitacao('${s.id}', '${s.nome || 'Usuário'}')">
                        <i class="fas fa-times"></i> Rejeitar
                    </button>
                </div>
            `;
            container.appendChild(card);
        });

        // Atualizar badge
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

async function aprovarSolicitacao(solicitacaoId, uid) {
    if (!confirm('Deseja aprovar esta solicitação? O usuário terá acesso completo ao sistema.')) {
        return;
    }

    try {
        // Buscar dados da solicitação
        const doc = await db.collection(SOLICITACOES_COLLECTION).doc(solicitacaoId).get();
        if (!doc.exists) {
            alert('❌ Solicitação não encontrada.');
            return;
        }

        const data = doc.data();

        // Atualizar solicitação para aprovada
        await db.collection(SOLICITACOES_COLLECTION).doc(solicitacaoId).update({
            status: 'aprovado',
            aprovadoEm: firebase.firestore.FieldValue.serverTimestamp(),
            aprovadoPor: currentUser.uid,
            aprovadoPorNome: currentUser.nome
        });

        // Atualizar usuário para admin
        await db.collection('usuarios').doc(uid).update({
            tipo: 'admin',
            aprovado: true,
            aprovadoEm: firebase.firestore.FieldValue.serverTimestamp(),
            aprovadoPor: currentUser.uid,
            aprovadoPorNome: currentUser.nome
        });

        alert(`✅ Usuário "${data.nome}" aprovado com sucesso!`);

        // Recarregar lista
        await carregarSolicitacoesPendentes();

    } catch (error) {
        console.error('❌ Erro ao aprovar solicitação:', error);
        alert('❌ Erro ao aprovar: ' + error.message);
    }
}

async function rejeitarSolicitacao(solicitacaoId, nome) {
    const motivo = prompt(`Digite o motivo da rejeição para "${nome}":`, 'Motivo não informado');
    if (motivo === null) return;

    if (!confirm(`Deseja rejeitar a solicitação de "${nome}"?\n\nMotivo: ${motivo}`)) {
        return;
    }

    try {
        // Buscar dados da solicitação
        const doc = await db.collection(SOLICITACOES_COLLECTION).doc(solicitacaoId).get();
        if (!doc.exists) {
            alert('❌ Solicitação não encontrada.');
            return;
        }

        const data = doc.data();
        const uid = data.uid;

        // Atualizar solicitação para rejeitada
        await db.collection(SOLICITACOES_COLLECTION).doc(solicitacaoId).update({
            status: 'rejeitado',
            motivoRejeicao: motivo,
            rejeitadoEm: firebase.firestore.FieldValue.serverTimestamp(),
            rejeitadoPor: currentUser.uid,
            rejeitadoPorNome: currentUser.nome
        });

        // Atualizar usuário para rejeitado
        await db.collection('usuarios').doc(uid).update({
            tipo: 'rejeitado',
            aprovado: false,
            motivoRejeicao: motivo,
            rejeitadoEm: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert(`✅ Solicitação de "${nome}" rejeitada.`);

        // Recarregar lista
        await carregarSolicitacoesPendentes();

    } catch (error) {
        console.error('❌ Erro ao rejeitar solicitação:', error);
        alert('❌ Erro ao rejeitar: ' + error.message);
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
        
        // Se for solicitante ou rejeitado, bloquear acesso
        if (userData.tipo === 'solicitante' || userData.tipo === 'rejeitado' || userData.aprovado === false) {
            await auth.signOut();
            const msg = userData.tipo === 'rejeitado' 
                ? `❌ Seu cadastro foi rejeitado.\nMotivo: ${userData.motivoRejeicao || 'Não informado'}\n\nEntre em contato com o administrador.`
                : `⏳ Seu cadastro está aguardando aprovação.\n\nVocê receberá um e-mail quando for aprovado.`;
            alert(msg);
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

// ==================== FUNÇÃO DE TESTE ====================

async function criarSolicitacaoTeste() {
    const nome = prompt('Digite o nome do usuário de teste:');
    const email = prompt('Digite o e-mail do usuário de teste:');
    const senha = prompt('Digite a senha (mínimo 6 caracteres):');

    if (!nome || !email || !senha) {
        alert('Todos os campos são obrigatórios!');
        return;
    }

    if (senha.length < 6) {
        alert('A senha deve ter pelo menos 6 caracteres.');
        return;
    }

    try {
        const userCred = await auth.createUserWithEmailAndPassword(email, senha);
        const uid = userCred.user.uid;

        await db.collection(SOLICITACOES_COLLECTION).doc(uid).set({
            uid: uid,
            nome: nome,
            email: email,
            telefone: '(83) 99999-9999',
            empresa: 'Empresa Teste',
            cargo: 'Analista',
            motivo: 'Teste de solicitação',
            status: 'pendente',
            criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
            criadoPor: uid,
            criadoPorNome: nome,
            tipoSolicitado: 'admin'
        });

        await db.collection('usuarios').doc(uid).set({
            uid: uid,
            nome: nome,
            email: email,
            tipo: 'solicitante',
            aprovado: false,
            criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
            solicitaAprovacao: true
        });

        alert('✅ Solicitação de teste criada com sucesso!');
        await carregarSolicitacoesPendentes();

    } catch (error) {
        console.error('❌ Erro:', error);
        alert('Erro: ' + error.message);
    }
}

// ==================== EXPOR FUNÇÕES ====================

window.solicitarCadastroAdmin = solicitarCadastroAdmin;
window.carregarSolicitacoesPendentes = carregarSolicitacoesPendentes;
window.aprovarSolicitacao = aprovarSolicitacao;
window.rejeitarSolicitacao = rejeitarSolicitacao;
window.verificarStatusUsuario = verificarStatusUsuario;
window.iniciarListenerSolicitacoes = iniciarListenerSolicitacoes;
window.criarSolicitacaoTeste = criarSolicitacaoTeste;