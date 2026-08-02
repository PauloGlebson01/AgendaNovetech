// ==================== COLABORADOR - FROTA (VERSÃO DEFINITIVA) ====================
// colaborador-frota.js

// ==================== VARIÁVEIS ====================
let agendamentosColaboradorCache = [];
let unsubscribeAgendamentosColaborador = null;
let agendamentosColaboradorListenerAtivo = false;
let colaboradorIdAtual = null;
let colaboradorInicializado = false;

// ==================== INICIAR MÓDULO DO COLABORADOR ====================
function iniciarFrotaColaborador() {
    console.log('🚗 Iniciando módulo de Frota para Colaborador...');
    console.log('📌 currentUser:', currentUser);
    
    // Verifica se o currentUser existe
    if (!currentUser) {
        console.warn('⚠️ Usuário não logado. Aguardando autenticação...');
        setTimeout(iniciarFrotaColaborador, 1000);
        return;
    }
    
    // Verifica se é colaborador ou admin
    if (currentUser.tipo !== 'colaborador' && currentUser.tipo !== 'admin') {
        console.warn('⚠️ Usuário não é colaborador. Tipo:', currentUser.tipo);
        mostrarMensagemSemAgendamentos('Acesso restrito a colaboradores.');
        return;
    }
    
    // Se for admin, mostra mensagem informativa
    if (currentUser.tipo === 'admin') {
        mostrarMensagemAdmin();
        return;
    }
    
    console.log('👤 Colaborador UID:', currentUser.uid);
    console.log('👤 Colaborador Nome:', currentUser.nome);
    console.log('👤 Colaborador Email:', currentUser.email);
    
    // Mostra loading
    mostrarLoading();
    
    // Busca o ID do colaborador
    buscarColaboradorId(currentUser.uid);
    
    // Inicializa módulos auxiliares
    setTimeout(() => {
        if (typeof criarModaisAnexos === 'function') {
            criarModaisAnexos();
        }
        if (typeof iniciarListenerAnexos === 'function') {
            iniciarListenerAnexos();
        }
    }, 500);
    
    console.log('✅ Módulo de Frota para Colaborador iniciado!');
}

// ==================== MOSTRAR LOADING ====================
function mostrarLoading() {
    const container = document.getElementById('listaAgendamentosColaborador');
    if (container) {
        container.innerHTML = `
            <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 40px; color: #2563eb;"></i>
                <h3 style="margin-top: 16px; color: #475569;">Carregando seus agendamentos...</h3>
                <p style="color: #94a3b8; font-size: 14px;">Aguarde um momento enquanto buscamos seus veículos agendados.</p>
            </div>
        `;
    }
}

// ==================== MOSTRAR MENSAGEM ADMIN ====================
function mostrarMensagemAdmin() {
    const container = document.getElementById('listaAgendamentosColaborador');
    if (container) {
        container.innerHTML = `
            <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 40px; border-left: 4px solid #2563eb;">
                <i class="fas fa-user-shield" style="font-size: 48px; color: #2563eb;"></i>
                <h3 style="margin-top: 12px; color: #0f172a;">👑 Área do Colaborador</h3>
                <p style="color: #64748b; font-size: 14px;">Esta seção exibe os agendamentos de veículos designados a você como colaborador.</p>
                <p style="color: #94a3b8; font-size: 13px; margin-top: 8px;">
                    <i class="fas fa-info-circle"></i> 
                    Como administrador, visualize todos os agendamentos na seção <strong>"Controle de Frota"</strong>.
                </p>
                <button onclick="reiniciarFrotaColaborador()" style="margin-top: 12px; padding: 8px 20px; background: #2563eb; color: white; border: none; border-radius: 8px; cursor: pointer;">
                    <i class="fas fa-redo"></i> Atualizar
                </button>
            </div>
        `;
    }
}

// ==================== MOSTRAR MENSAGEM SEM AGENDAMENTOS ====================
function mostrarMensagemSemAgendamentos(mensagem = 'Nenhum agendamento encontrado.') {
    const container = document.getElementById('listaAgendamentosColaborador');
    if (container) {
        container.innerHTML = `
            <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                <i class="fas fa-calendar-check" style="font-size: 48px; color: #cbd5e1;"></i>
                <h3 style="margin-top: 12px; color: #475569;">Nenhum agendamento encontrado</h3>
                <p style="color: #94a3b8; font-size: 14px;">${mensagem}</p>
                <p style="color: #94a3b8; font-size: 13px; margin-top: 8px;">
                    <i class="fas fa-info-circle"></i> 
                    Seus agendamentos aparecerão aqui assim que forem criados pelo administrador.
                </p>
                <button onclick="reiniciarFrotaColaborador()" style="margin-top: 12px; padding: 8px 20px; background: #2563eb; color: white; border: none; border-radius: 8px; cursor: pointer;">
                    <i class="fas fa-redo"></i> Buscar agendamentos
                </button>
            </div>
        `;
    }
}

// ==================== BUSCAR ID DO COLABORADOR ====================
function buscarColaboradorId(uid) {
    if (!uid) {
        console.warn('⚠️ UID não fornecido para buscar colaborador');
        iniciarListenerAgendamentosColaborador(uid);
        return;
    }

    console.log('🔍 Buscando colaborador com UID:', uid);
    
    // Primeiro tenta buscar pelo UID
    db.collection('colaboradores')
        .where('uid', '==', uid)
        .get()
        .then((snapshot) => {
            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                colaboradorIdAtual = doc.id;
                const data = doc.data();
                console.log('✅ Colaborador encontrado! ID:', colaboradorIdAtual, 'Nome:', data.nome);
                iniciarListenerAgendamentosColaborador(colaboradorIdAtual);
                return;
            }
            
            // Se não encontrou pelo UID, tenta pelo email
            console.warn('⚠️ Colaborador não encontrado pelo UID. Tentando por email...');
            db.collection('colaboradores')
                .where('email', '==', currentUser.email)
                .get()
                .then((snapshot2) => {
                    if (!snapshot2.empty) {
                        const doc = snapshot2.docs[0];
                        colaboradorIdAtual = doc.id;
                        console.log('✅ Colaborador encontrado por email! ID:', colaboradorIdAtual);
                        iniciarListenerAgendamentosColaborador(colaboradorIdAtual);
                        return;
                    }
                    
                    // Se não encontrou, tenta criar
                    console.warn('⚠️ Colaborador não encontrado. Tentando criar...');
                    criarColaboradorSeNecessario(uid);
                })
                .catch((err) => {
                    console.error('❌ Erro ao buscar colaborador por email:', err);
                    criarColaboradorSeNecessario(uid);
                });
        })
        .catch((error) => {
            console.error('❌ Erro ao buscar colaborador:', error);
            criarColaboradorSeNecessario(uid);
        });
}

// ==================== CRIAR COLABORADOR SE NECESSÁRIO ====================
async function criarColaboradorSeNecessario(uid) {
    console.log('🔄 Tentando criar colaborador para UID:', uid);
    
    try {
        // Verifica se o usuário existe
        const userDoc = await db.collection('usuarios').doc(uid).get();
        if (!userDoc.exists) {
            console.warn('⚠️ Usuário não encontrado na coleção de usuários');
            mostrarMensagemSemAgendamentos('Usuário não cadastrado corretamente.');
            return;
        }
        
        const userData = userDoc.data();
        console.log('📋 Dados do usuário:', userData);
        
        // Cria o colaborador
        const colaboradorRef = db.collection('colaboradores').doc(uid);
        await colaboradorRef.set({
            uid: uid,
            nome: userData.nome || currentUser.nome || 'Colaborador',
            email: userData.email || currentUser.email,
            telefone: userData.telefone || '',
            cargo: userData.cargo || '',
            ativo: true,
            tipo: userData.tipo || 'colaborador',
            criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
            criadoPor: 'sistema',
            criadoPorNome: 'Sistema'
        });
        
        console.log('✅ Colaborador criado com sucesso!');
        colaboradorIdAtual = uid;
        iniciarListenerAgendamentosColaborador(uid);
        
    } catch (error) {
        console.error('❌ Erro ao criar colaborador:', error);
        mostrarMensagemSemAgendamentos('Erro ao criar perfil de colaborador.');
    }
}

// ==================== LISTENER DE AGENDAMENTOS DO COLABORADOR ====================
function iniciarListenerAgendamentosColaborador(colaboradorId) {
    console.log('🔍 Iniciando listener para colaborador ID:', colaboradorId);
    
    // Remove listener anterior
    if (unsubscribeAgendamentosColaborador) {
        unsubscribeAgendamentosColaborador();
        unsubscribeAgendamentosColaborador = null;
    }

    if (!db || !currentUser) {
        console.error('❌ Firestore ou usuário não inicializado');
        setTimeout(() => {
            if (colaboradorId) {
                iniciarListenerAgendamentosColaborador(colaboradorId);
            }
        }, 2000);
        return;
    }

    const idParaBusca = colaboradorId || currentUser.uid;
    console.log('🔍 Buscando agendamentos para ID:', idParaBusca);
    
    try {
        // ============================================================
        // 🔥 BUSCA ÚNICA: Usamos uma query que busca por ambos os campos
        // ============================================================
        // Para garantir que todos os agendamentos sejam encontrados,
        // usamos uma abordagem que combina os resultados de duas queries
        // ============================================================

        let unsubscribe1 = null;
        let unsubscribe2 = null;
        let timeoutId = null;
        let firstLoad = true;

        // ============================================================
        // 🔥 FUNÇÃO PARA MESCLAR E ATUALIZAR
        // ============================================================
        function mesclarEAtualizar(query1Docs, query2Docs) {
            const mapa = new Map();
            
            // Adiciona documentos da query1
            query1Docs.forEach(doc => {
                const data = doc.data();
                mapa.set(doc.id, {
                    id: doc.id,
                    ...data,
                    data: data.data || ''
                });
            });
            
            // Adiciona documentos da query2
            query2Docs.forEach(doc => {
                if (!mapa.has(doc.id)) {
                    const data = doc.data();
                    mapa.set(doc.id, {
                        id: doc.id,
                        ...data,
                        data: data.data || ''
                    });
                }
            });
            
            // Converte para array e ordena
            const resultados = Array.from(mapa.values());
            resultados.sort((a, b) => {
                if (a.data < b.data) return 1;
                if (a.data > b.data) return -1;
                return (a.horarioSaida || '').localeCompare(b.horarioSaida || '');
            });
            
            console.log(`📊 ${resultados.length} agendamentos encontrados`);
            
            // Atualiza cache e UI
            agendamentosColaboradorCache = resultados;
            atualizarListaAgendamentosColaborador();
            agendamentosColaboradorListenerAtivo = true;
            colaboradorInicializado = true;
            
            // Remove loading se ainda estiver mostrando
            const container = document.getElementById('listaAgendamentosColaborador');
            if (container && container.innerHTML.includes('Carregando seus agendamentos')) {
                // A UI será atualizada pela função acima
            }
        }

        // ============================================================
        // 🔥 QUERY 1: Por colaboradorId
        // ============================================================
        const query1 = db.collection('frota_agendamentos')
            .where('colaboradorId', '==', idParaBusca);

        // ============================================================
        // 🔥 QUERY 2: Por colaboradorUid
        // ============================================================
        const query2 = db.collection('frota_agendamentos')
            .where('colaboradorUid', '==', currentUser.uid);

        // ============================================================
        // 🔥 ESTADO DAS QUERIES
        // ============================================================
        let query1Snap = null;
        let query2Snap = null;
        let query1Ready = false;
        let query2Ready = false;

        // ============================================================
        // 🔥 FUNÇÃO PARA VERIFICAR SE AMBAS ESTÃO PRONTAS
        // ============================================================
        function verificarAmbasProntas() {
            if (query1Ready && query2Ready) {
                const docs1 = query1Snap ? query1Snap.docs : [];
                const docs2 = query2Snap ? query2Snap.docs : [];
                mesclarEAtualizar(docs1, docs2);
                return true;
            }
            return false;
        }

        // ============================================================
        // 🔥 LISTENER 1 (colaboradorId)
        // ============================================================
        unsubscribe1 = query1.onSnapshot((snapshot) => {
            console.log('🔄 Query1 (colaboradorId):', snapshot.size, 'documentos');
            query1Snap = snapshot;
            query1Ready = true;
            
            // Se a query2 já está pronta, mescla
            if (query2Ready) {
                verificarAmbasProntas();
            } else {
                // Mostra resultados parciais se houver
                if (snapshot.size > 0) {
                    const docs1 = snapshot.docs;
                    const docs2 = query2Snap ? query2Snap.docs : [];
                    mesclarEAtualizar(docs1, docs2);
                }
            }
        }, (error) => {
            console.error('❌ Erro no listener da query1:', error);
            query1Ready = true;
            if (query2Ready) {
                verificarAmbasProntas();
            }
        });

        // ============================================================
        // 🔥 LISTENER 2 (colaboradorUid)
        // ============================================================
        unsubscribe2 = query2.onSnapshot((snapshot) => {
            console.log('🔄 Query2 (colaboradorUid):', snapshot.size, 'documentos');
            query2Snap = snapshot;
            query2Ready = true;
            
            if (query1Ready) {
                verificarAmbasProntas();
            } else {
                if (snapshot.size > 0) {
                    const docs1 = query1Snap ? query1Snap.docs : [];
                    const docs2 = snapshot.docs;
                    mesclarEAtualizar(docs1, docs2);
                }
            }
        }, (error) => {
            console.error('❌ Erro no listener da query2:', error);
            query2Ready = true;
            if (query1Ready) {
                verificarAmbasProntas();
            }
        });

        // ============================================================
        // 🔥 TIMEOUT DE SEGURANÇA (5 segundos)
        // ============================================================
        timeoutId = setTimeout(() => {
            console.warn('⏰ Timeout: Verificando dados disponíveis...');
            
            if (!query1Ready || !query2Ready) {
                // Tenta buscar diretamente
                console.log('🔍 Buscando dados diretamente...');
                
                Promise.all([
                    db.collection('frota_agendamentos')
                        .where('colaboradorId', '==', idParaBusca)
                        .get(),
                    db.collection('frota_agendamentos')
                        .where('colaboradorUid', '==', currentUser.uid)
                        .get()
                ])
                .then(([snap1, snap2]) => {
                    const docs1 = snap1.docs;
                    const docs2 = snap2.docs;
                    
                    if (docs1.length > 0 || docs2.length > 0) {
                        console.log('✅ Dados encontrados na busca direta!');
                        mesclarEAtualizar(docs1, docs2);
                    } else {
                        console.log('ℹ️ Nenhum agendamento encontrado.');
                        // Se não há dados, mostra mensagem de vazio
                        agendamentosColaboradorCache = [];
                        atualizarListaAgendamentosColaborador();
                        agendamentosColaboradorListenerAtivo = true;
                        colaboradorInicializado = true;
                    }
                })
                .catch(err => {
                    console.error('❌ Erro na busca direta:', err);
                    // Se deu erro, mostra mensagem de erro
                    if (!colaboradorInicializado) {
                        agendamentosColaboradorCache = [];
                        atualizarListaAgendamentosColaborador();
                        agendamentosColaboradorListenerAtivo = true;
                        colaboradorInicializado = true;
                    }
                });
            } else {
                // Se as queries estão prontas mas não há dados
                if (!colaboradorInicializado) {
                    agendamentosColaboradorCache = [];
                    atualizarListaAgendamentosColaborador();
                    agendamentosColaboradorListenerAtivo = true;
                    colaboradorInicializado = true;
                }
            }
        }, 5000);

        // ============================================================
        // 🔥 UNSUBSCRIBE PRINCIPAL
        // ============================================================
        unsubscribeAgendamentosColaborador = () => {
            console.log('🔌 Removendo listeners...');
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
            if (unsubscribe1) {
                unsubscribe1();
                unsubscribe1 = null;
            }
            if (unsubscribe2) {
                unsubscribe2();
                unsubscribe2 = null;
            }
            query1Snap = null;
            query2Snap = null;
            query1Ready = false;
            query2Ready = false;
        };

        console.log('✅ Listeners iniciados com sucesso!');

    } catch (error) {
        console.error('❌ Erro ao iniciar listener:', error);
        mostrarErroNoContainer(error.message);
    }
}

// ==================== MOSTRAR ERRO NO CONTAINER ====================
function mostrarErroNoContainer(mensagem) {
    const container = document.getElementById('listaAgendamentosColaborador');
    if (container) {
        container.innerHTML = `
            <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 40px; border-left: 4px solid #ef4444;">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #ef4444;"></i>
                <h3 style="margin-top: 12px; color: #ef4444;">Erro ao carregar agendamentos</h3>
                <p style="color: #64748b; font-size: 14px;">${mensagem}</p>
                <button onclick="reiniciarFrotaColaborador()" style="margin-top: 12px; padding: 8px 20px; background: #2563eb; color: white; border: none; border-radius: 8px; cursor: pointer;">
                    <i class="fas fa-redo"></i> Tentar novamente
                </button>
            </div>
        `;
    }
}

// ==================== FUNÇÃO PARA REINICIAR ====================
function reiniciarFrotaColaborador() {
    console.log('🔄 Reiniciando módulo de frota do colaborador...');
    if (unsubscribeAgendamentosColaborador) {
        unsubscribeAgendamentosColaborador();
        unsubscribeAgendamentosColaborador = null;
    }
    agendamentosColaboradorCache = [];
    agendamentosColaboradorListenerAtivo = false;
    colaboradorIdAtual = null;
    colaboradorInicializado = false;
    
    // Mostra loading
    mostrarLoading();
    
    if (currentUser) {
        setTimeout(() => {
            buscarColaboradorId(currentUser.uid);
        }, 300);
    } else {
        setTimeout(() => {
            if (currentUser) {
                buscarColaboradorId(currentUser.uid);
            } else {
                mostrarMensagemSemAgendamentos('Usuário não autenticado. Faça login novamente.');
            }
        }, 1000);
    }
}

// ==================== ATUALIZAR LISTA DE AGENDAMENTOS DO COLABORADOR ====================
function atualizarListaAgendamentosColaborador() {
    const container = document.getElementById('listaAgendamentosColaborador');
    if (!container) {
        console.warn('⚠️ Elemento listaAgendamentosColaborador não encontrado');
        return;
    }

    console.log(`📋 Renderizando ${agendamentosColaboradorCache.length} agendamentos`);

    if (agendamentosColaboradorCache.length === 0) {
        mostrarMensagemSemAgendamentos('Você não possui agendamentos de veículos no momento.');
        return;
    }

    const statusLabels = {
        'agendado': '📋 Agendado',
        'em_andamento': '🔄 Em Andamento',
        'concluido': '✅ Concluído',
        'cancelado': '❌ Cancelado'
    };

    const statusColors = {
        'agendado': '#dbeafe',
        'em_andamento': '#fef3c7',
        'concluido': '#d1fae5',
        'cancelado': '#fee2e2'
    };

    const statusTextColors = {
        'agendado': '#1d4ed8',
        'em_andamento': '#d97706',
        'concluido': '#059669',
        'cancelado': '#dc2626'
    };

    const tipoLabels = {
        'reuniao': '📋 Reunião',
        'visita_cliente': '👤 Visita a Cliente',
        'entrega': '📦 Entrega',
        'coleta': '📦 Coleta',
        'servico': '🔧 Serviço Técnico',
        'treinamento': '🎓 Treinamento',
        'outro': '📌 Outro'
    };

    // Verifica anexos
    let anexosDoColaborador = [];
    if (typeof anexosCache !== 'undefined' && Array.isArray(anexosCache)) {
        anexosDoColaborador = anexosCache.filter(a => a.criadoPor === currentUser?.uid);
    }

    container.innerHTML = '';
    agendamentosColaboradorCache.forEach(a => {
        const dataStr = formatarDataParaExibicaoSimples(a.data);
        const status = a.status || 'agendado';
        
        const anexosDoEvento = anexosDoColaborador.filter(an => an.eventoId === a.id);
        const temAnexos = anexosDoEvento.length > 0;
        
        const hoje = new Date().toISOString().split('T')[0];
        const isAtrasado = a.data < hoje && status !== 'concluido' && status !== 'cancelado';

        const card = document.createElement('div');
        card.className = 'card';
        card.style.borderLeft = `4px solid ${status === 'cancelado' ? '#94a3b8' : '#2563eb'}`;
        card.dataset.eventoId = a.id;

        const podeAlterarStatus = (status === 'agendado' || status === 'em_andamento');

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap; gap: 8px;">
                <div style="flex: 1;">
                    <h3 style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 16px;">
                        <i class="fas fa-calendar-day" style="color: #2563eb;"></i>
                        ${dataStr}
                        <span class="status-badge" style="background: ${statusColors[status] || '#f1f5f9'}; color: ${statusTextColors[status] || '#1e293b'}; font-size: 11px; padding: 2px 10px;">
                            ${statusLabels[status] || status}
                        </span>
                        ${isAtrasado ? `<span class="status-badge" style="background: #fee2e2; color: #dc2626; font-size: 11px; padding: 2px 10px;">⏰ Atrasado</span>` : ''}
                        ${temAnexos ? `<span class="status-badge" style="background: #dbeafe; color: #1d4ed8; font-size: 11px; padding: 2px 10px;">
                            <i class="fas fa-paperclip"></i> ${anexosDoEvento.length} anexo(s)
                        </span>` : ''}
                    </h3>
                    <p style="margin: 4px 0;">
                        <i class="fas fa-truck" style="color: #64748b;"></i> 
                        <strong>${a.veiculoNome || 'Veículo'}</strong> - ${a.veiculoPlaca || 'N/A'}
                    </p>
                    <p style="margin: 4px 0;">
                        <i class="fas fa-clock" style="color: #64748b;"></i> 
                        Saída: <strong>${a.horarioSaida || '--:--'}</strong>
                        ${a.horarioRetorno ? ` | Retorno: <strong>${a.horarioRetorno}</strong>` : ''}
                    </p>
                    <p style="margin: 4px 0;">
                        <i class="fas fa-map-marker-alt" style="color: #64748b;"></i> 
                        ${a.destino || 'Destino não informado'}
                    </p>
                    <p style="margin: 4px 0;">
                        <span class="status-badge" style="background: #f1f5f9; color: #475569; font-size: 11px; padding: 2px 10px;">
                            ${tipoLabels[a.tipo] || a.tipo}
                        </span>
                        ${a.kmSaida > 0 ? `<span style="font-size: 12px; color: #64748b; margin-left: 8px;"><i class="fas fa-road"></i> KM Saída: ${a.kmSaida}</span>` : ''}
                        ${a.kmRetorno > 0 ? `<span style="font-size: 12px; color: #64748b; margin-left: 8px;"><i class="fas fa-road"></i> KM Retorno: ${a.kmRetorno}</span>` : ''}
                    </p>
                    ${a.observacoes ? `<p style="font-size: 13px; color: #64748b; margin-top: 4px;"><i class="fas fa-info-circle"></i> ${a.observacoes}</p>` : ''}
                </div>
            </div>
            <div style="margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap;">
                ${podeAlterarStatus ? `
                    ${status === 'agendado' ? `<button class="btn-sm" style="background: #fef3c7; color: #d97706;" onclick="alterarStatusAgendamentoColaborador('${a.id}', 'em_andamento')"><i class="fas fa-play"></i> Iniciar</button>` : ''}
                    ${status === 'em_andamento' ? `<button class="btn-sm" style="background: #d1fae5; color: #059669;" onclick="alterarStatusAgendamentoColaborador('${a.id}', 'concluido')"><i class="fas fa-check"></i> Concluir</button>` : ''}
                    <button class="btn-sm" style="background: #fee2e2; color: #dc2626;" onclick="alterarStatusAgendamentoColaborador('${a.id}', 'cancelado')"><i class="fas fa-times"></i> Cancelar</button>
                ` : ''}
                <button class="btn-sm" style="background: #8b5cf6; color: white;" onclick="abrirModalAnexosColaborador('${a.id}')">
                    <i class="fas ${temAnexos ? 'fa-paperclip' : 'fa-plus'}"></i>
                    ${temAnexos ? 'Ver Comprovantes' : 'Adicionar Comprovante'}
                </button>
            </div>
        `;

        container.appendChild(card);
    });
}

// ==================== ALTERAR STATUS DO AGENDAMENTO (COLABORADOR) ====================
async function alterarStatusAgendamentoColaborador(eventoId, novoStatus) {
    if (!eventoId || !novoStatus) {
        mostrarNotificacao('❌ Dados inválidos para alterar status.', 'error');
        return;
    }

    const statusLabels = {
        'agendado': '📋 Agendado',
        'em_andamento': '🔄 Em Andamento',
        'concluido': '✅ Concluído',
        'cancelado': '❌ Cancelado'
    };

    if (!confirm(`Deseja alterar o status para "${statusLabels[novoStatus]}"?`)) {
        return;
    }

    try {
        const agendamento = agendamentosColaboradorCache.find(a => a.id === eventoId);
        if (!agendamento) {
            mostrarNotificacao('❌ Agendamento não encontrado.', 'error');
            return;
        }

        const isResponsavel = agendamento.colaboradorId === colaboradorIdAtual || 
                             agendamento.colaboradorUid === currentUser?.uid;
        
        if (!isResponsavel) {
            mostrarNotificacao('❌ Você não tem permissão para alterar este agendamento.', 'error');
            return;
        }

        await db.collection('frota_agendamentos').doc(eventoId).update({
            status: novoStatus,
            statusAtualizadoEm: firebase.firestore.FieldValue.serverTimestamp(),
            statusAtualizadoPor: currentUser.uid,
            statusAtualizadoPorNome: currentUser.nome
        });

        const index = agendamentosColaboradorCache.findIndex(a => a.id === eventoId);
        if (index !== -1) {
            agendamentosColaboradorCache[index].status = novoStatus;
            atualizarListaAgendamentosColaborador();
        }

        mostrarNotificacao(`✅ Status alterado para "${statusLabels[novoStatus]}" com sucesso!`, 'success');

    } catch (error) {
        console.error('❌ Erro ao alterar status:', error);
        mostrarNotificacao('❌ Erro ao alterar status: ' + error.message, 'error');
    }
}

// ==================== ABRIR MODAL DE ANEXOS DO COLABORADOR ====================
function abrirModalAnexosColaborador(eventoId) {
    if (!eventoId) {
        mostrarNotificacao('❌ ID do agendamento não fornecido.', 'error');
        return;
    }

    const agendamento = agendamentosColaboradorCache.find(a => a.id === eventoId);
    if (!agendamento) {
        mostrarNotificacao('❌ Agendamento não encontrado ou você não tem permissão.', 'error');
        return;
    }

    if (typeof abrirModalAnexos === 'function') {
        abrirModalAnexos(eventoId);
    } else {
        mostrarNotificacao('⚠️ Módulo de anexos não disponível.', 'warning');
    }
}

// ==================== FUNÇÃO PARA MOSTRAR NOTIFICAÇÃO ====================
function mostrarNotificacao(mensagem, tipo = 'info') {
    if (typeof window.mostrarNotificacao === 'function' && 
        window.mostrarNotificacao !== mostrarNotificacao) {
        window.mostrarNotificacao(mensagem, tipo);
        return;
    }
    
    const prefixo = tipo === 'error' ? '❌ ' : tipo === 'success' ? '✅ ' : '';
    alert(prefixo + mensagem);
}

// ==================== FUNÇÃO DE FORMATAÇÃO ====================
function formatarDataParaExibicaoSimples(data) {
    if (!data) return 'Data não definida';
    const partes = data.split('-');
    if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return data;
}

// ==================== EXPOR FUNÇÕES ====================
window.iniciarFrotaColaborador = iniciarFrotaColaborador;
window.abrirModalAnexosColaborador = abrirModalAnexosColaborador;
window.mostrarNotificacao = mostrarNotificacao;
window.reiniciarFrotaColaborador = reiniciarFrotaColaborador;
window.alterarStatusAgendamentoColaborador = alterarStatusAgendamentoColaborador;

console.log('✅ Módulo de Frota para Colaborador carregado!');