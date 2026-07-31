// ==================== RELATÓRIOS DA FROTA ====================
// frota-relatorios.js

// ==================== VARIÁVEIS ====================
let relatorioDadosCache = null;

// ==================== DEFINIR PERÍODOS RÁPIDOS ====================
function definirPeriodoHoje() {
    const hoje = new Date();
    const dataStr = hoje.toISOString().split('T')[0];
    document.getElementById('relatorioDataInicio').value = dataStr;
    document.getElementById('relatorioDataFim').value = dataStr;
    gerarRelatorioFrota();
}

function definirPeriodoSemana() {
    const hoje = new Date();
    const inicio = new Date(hoje);
    inicio.setDate(hoje.getDate() - 7);
    document.getElementById('relatorioDataInicio').value = inicio.toISOString().split('T')[0];
    document.getElementById('relatorioDataFim').value = hoje.toISOString().split('T')[0];
    gerarRelatorioFrota();
}

function definirPeriodoMes() {
    const hoje = new Date();
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    document.getElementById('relatorioDataInicio').value = inicio.toISOString().split('T')[0];
    document.getElementById('relatorioDataFim').value = hoje.toISOString().split('T')[0];
    gerarRelatorioFrota();
}

function definirPeriodoUltimos30Dias() {
    const hoje = new Date();
    const inicio = new Date(hoje);
    inicio.setDate(hoje.getDate() - 30);
    document.getElementById('relatorioDataInicio').value = inicio.toISOString().split('T')[0];
    document.getElementById('relatorioDataFim').value = hoje.toISOString().split('T')[0];
    gerarRelatorioFrota();
}

// ==================== GERAR RELATÓRIO ====================
async function gerarRelatorioFrota() {
    const dataInicio = document.getElementById('relatorioDataInicio').value;
    const dataFim = document.getElementById('relatorioDataFim').value;
    const tipo = document.getElementById('relatorioTipo').value;

    if (!dataInicio || !dataFim) {
        mostrarNotificacao('❌ Selecione o período para gerar o relatório.', 'error');
        return;
    }

    if (dataInicio > dataFim) {
        mostrarNotificacao('⚠️ A data inicial não pode ser maior que a data final.', 'warning');
        return;
    }

    const placeholder = document.getElementById('relatorioPlaceholder');
    const resultado = document.getElementById('relatorioResultado');
    const dashboard = document.getElementById('relatorioDashboard');

    placeholder.style.display = 'none';
    resultado.style.display = 'block';
    dashboard.style.display = 'grid';

    document.getElementById('relatorioConteudo').innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <i class="fas fa-spinner fa-spin" style="font-size: 32px; color: #2563eb;"></i>
            <p style="margin-top: 12px; color: #94a3b8;">Carregando dados do relatório...</p>
        </div>
    `;

    try {
        const dados = await buscarDadosRelatorio(dataInicio, dataFim, tipo);
        relatorioDadosCache = dados;
        renderizarRelatorio(dados, tipo, dataInicio, dataFim);
        atualizarDashboardRelatorio(dados);
        mostrarNotificacao(`✅ Relatório gerado com sucesso! (${dados.totalRegistros || 0} registros)`, 'success');
    } catch (error) {
        console.error('❌ Erro ao gerar relatório:', error);
        document.getElementById('relatorioConteudo').innerHTML = `
            <div style="text-align: center; padding: 40px; color: #ef4444;">
                <i class="fas fa-exclamation-triangle" style="font-size: 32px;"></i>
                <p style="margin-top: 12px;"><strong>Erro ao carregar dados:</strong></p>
                <p style="color: #64748b;">${error.message}</p>
                <button onclick="gerarRelatorioFrota()" class="btn-primary" style="width: auto; padding: 10px 32px; margin-top: 12px;">
                    <i class="fas fa-redo"></i> Tentar novamente
                </button>
            </div>
        `;
    }
}

// ==================== BUSCAR DADOS DO RELATÓRIO ====================
async function buscarDadosRelatorio(dataInicio, dataFim, tipo) {
    const inicio = dataInicio + 'T00:00:00.000Z';
    const fim = dataFim + 'T23:59:59.999Z';

    let resultados = {
        veiculos: [],
        manutencoes: [],
        abastecimentos: [],
        multas: [],
        totalRegistros: 0,
        totalGasto: 0,
        periodo: { inicio: dataInicio, fim: dataFim },
        tipo: tipo
    };

    // Buscar veículos (sempre)
    try {
        const veiculosSnap = await db.collection('frota_veiculos').get();
        veiculosSnap.forEach(doc => {
            resultados.veiculos.push({ id: doc.id, ...doc.data() });
        });
    } catch (e) {
        console.warn('⚠️ Erro ao buscar veículos:', e);
    }

    // Buscar manutenções
    if (tipo === 'geral' || tipo === 'manutencoes' || tipo === 'completo') {
        try {
            const snap = await db.collection('frota_manutencoes')
                .where('data', '>=', inicio)
                .where('data', '<=', fim)
                .get();
            snap.forEach(doc => {
                const data = doc.data();
                resultados.manutencoes.push({ id: doc.id, ...data });
                resultados.totalGasto += data.valor || 0;
            });
        } catch (e) {
            console.warn('⚠️ Erro ao buscar manutenções:', e);
        }
    }

    // Buscar abastecimentos
    if (tipo === 'geral' || tipo === 'abastecimentos' || tipo === 'completo') {
        try {
            const snap = await db.collection('frota_abastecimentos')
                .where('data', '>=', inicio)
                .where('data', '<=', fim)
                .get();
            snap.forEach(doc => {
                const data = doc.data();
                resultados.abastecimentos.push({ id: doc.id, ...data });
                resultados.totalGasto += data.valor || 0;
            });
        } catch (e) {
            console.warn('⚠️ Erro ao buscar abastecimentos:', e);
        }
    }

    // Buscar multas
    if (tipo === 'geral' || tipo === 'multas' || tipo === 'completo') {
        try {
            const snap = await db.collection('frota_multas')
                .where('data', '>=', inicio)
                .where('data', '<=', fim)
                .get();
            snap.forEach(doc => {
                const data = doc.data();
                resultados.multas.push({ id: doc.id, ...data });
                resultados.totalGasto += data.valor || 0;
            });
        } catch (e) {
            console.warn('⚠️ Erro ao buscar multas:', e);
        }
    }

    resultados.totalRegistros = resultados.manutencoes.length + resultados.abastecimentos.length + resultados.multas.length;

    return resultados;
}

// ==================== RENDERIZAR RELATÓRIO ====================
function renderizarRelatorio(dados, tipo, dataInicio, dataFim) {
    const container = document.getElementById('relatorioConteudo');
    const periodoLabel = `${formatarDataParaExibicaoSimples(dataInicio)} até ${formatarDataParaExibicaoSimples(dataFim)}`;
    
    const dataFormatada = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    let html = `
        <div class="relatorio-header">
            <h3>
                <i class="fas fa-file-alt" style="color: #2563eb;"></i>
                ${getTipoLabel(tipo)}
            </h3>
            <span class="relatorio-periodo">📅 ${periodoLabel} | Gerado em: ${dataFormatada}</span>
        </div>
    `;

    // Resumo rápido
    html += `
        <div class="relatorio-resumo">
            <div class="relatorio-resumo-item" style="border-left-color: #2563eb;">
                <div class="label">Veículos</div>
                <div class="value azul">${dados.veiculos.length}</div>
            </div>
            <div class="relatorio-resumo-item" style="border-left-color: #f59e0b;">
                <div class="label">Manutenções</div>
                <div class="value laranja">${dados.manutencoes.length}</div>
            </div>
            <div class="relatorio-resumo-item" style="border-left-color: #10b981;">
                <div class="label">Abastecimentos</div>
                <div class="value verde">${dados.abastecimentos.length}</div>
            </div>
            <div class="relatorio-resumo-item" style="border-left-color: #ef4444;">
                <div class="label">Multas</div>
                <div class="value vermelho">${dados.multas.length}</div>
            </div>
            <div class="relatorio-resumo-item" style="border-left-color: #8b5cf6;">
                <div class="label">Total Gasto</div>
                <div class="value azul">R$ ${dados.totalGasto.toFixed(2)}</div>
            </div>
        </div>
    `;

    // Conteúdo específico por tipo
    if (tipo === 'geral' || tipo === 'completo') {
        html += renderizarTabelaVeiculos(dados.veiculos);
    }

    if (tipo === 'geral' || tipo === 'manutencoes' || tipo === 'completo') {
        html += renderizarTabelaManutencoes(dados.manutencoes);
    }

    if (tipo === 'geral' || tipo === 'abastecimentos' || tipo === 'completo') {
        html += renderizarTabelaAbastecimentos(dados.abastecimentos);
    }

    if (tipo === 'geral' || tipo === 'multas' || tipo === 'completo') {
        html += renderizarTabelaMultas(dados.multas);
    }

    if (dados.manutencoes.length === 0 && dados.abastecimentos.length === 0 && dados.multas.length === 0) {
        html += `
            <div style="text-align: center; padding: 40px; color: #94a3b8;">
                <i class="fas fa-info-circle" style="font-size: 32px;"></i>
                <p style="margin-top: 8px;">Nenhum registro encontrado para o período selecionado.</p>
            </div>
        `;
    }

    container.innerHTML = html;
}

// ==================== RENDERIZAR TABELAS ====================
function renderizarTabelaVeiculos(veiculos) {
    if (veiculos.length === 0) return '';

    let html = `
        <h4 style="margin: 24px 0 12px; color: #0f172a; display: flex; align-items: center; gap: 8px;">
            <i class="fas fa-truck" style="color: #2563eb;"></i>
            Veículos da Frota (${veiculos.length})
        </h4>
        <table>
            <thead>
                <tr>
                    <th>Marca</th>
                    <th>Modelo</th>
                    <th>Placa</th>
                    <th>Ano</th>
                    <th>Cor</th>
                    <th>KM Atual</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
    `;

    veiculos.forEach(v => {
        const status = v.ativo !== false ? '✅ Ativo' : '❌ Inativo';
        const statusColor = v.ativo !== false ? '#059669' : '#dc2626';
        html += `
            <tr>
                <td><strong>${v.marca || '-'}</strong></td>
                <td>${v.modelo || '-'}</td>
                <td><strong>${v.placa || '-'}</strong></td>
                <td>${v.ano || '-'}</td>
                <td>${v.cor || '-'}</td>
                <td>${v.kmAtual || 0} km</td>
                <td style="color: ${statusColor}; font-weight: 600;">${status}</td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    return html;
}

function renderizarTabelaManutencoes(manutencoes) {
    if (manutencoes.length === 0) return '';

    const tiposLabels = {
        'preventiva': '🛡️ Preventiva',
        'corretiva': '🔧 Corretiva',
        'emergencial': '🚨 Emergencial',
        'revisao': '📋 Revisão'
    };

    let total = 0;
    manutencoes.forEach(m => total += m.valor || 0);

    let html = `
        <h4 style="margin: 24px 0 12px; color: #0f172a; display: flex; align-items: center; gap: 8px;">
            <i class="fas fa-tools" style="color: #f59e0b;"></i>
            Manutenções (${manutencoes.length}) - Total: R$ ${total.toFixed(2)}
        </h4>
        <table>
            <thead>
                <tr>
                    <th>Data</th>
                    <th>Veículo</th>
                    <th>Placa</th>
                    <th>Tipo</th>
                    <th>Descrição</th>
                    <th>Responsável</th>
                    <th>KM</th>
                    <th style="text-align: right;">Valor</th>
                </tr>
            </thead>
            <tbody>
    `;

    manutencoes.forEach(m => {
        const dataStr = formatarDataParaExibicao(m.data);
        html += `
            <tr>
                <td>${dataStr}</td>
                <td>${m.veiculoNome || '-'}</td>
                <td><strong>${m.veiculoPlaca || '-'}</strong></td>
                <td>${tiposLabels[m.tipo] || m.tipo}</td>
                <td>${m.descricao || '-'}</td>
                <td>${m.responsavel || '-'}</td>
                <td>${m.km || 0}</td>
                <td style="text-align: right; font-weight: 600;">R$ ${(m.valor || 0).toFixed(2)}</td>
            </tr>
        `;
    });

    html += `
            <tr class="total-row">
                <td colspan="7" style="text-align: right;">TOTAL MANUTENÇÕES</td>
                <td style="text-align: right;">R$ ${total.toFixed(2)}</td>
            </tr>
        </tbody></table>
    `;
    return html;
}

function renderizarTabelaAbastecimentos(abastecimentos) {
    if (abastecimentos.length === 0) return '';

    const combustivelLabels = {
        'gasolina': '⛽ Gasolina',
        'etanol': '🌽 Etanol',
        'diesel': '🛢️ Diesel',
        'gnv': '🔵 GNV'
    };

    let totalValor = 0;
    let totalLitros = 0;
    abastecimentos.forEach(a => {
        totalValor += a.valor || 0;
        totalLitros += a.litros || 0;
    });

    let html = `
        <h4 style="margin: 24px 0 12px; color: #0f172a; display: flex; align-items: center; gap: 8px;">
            <i class="fas fa-gas-pump" style="color: #10b981;"></i>
            Abastecimentos (${abastecimentos.length}) - Total: R$ ${totalValor.toFixed(2)} | ${totalLitros.toFixed(1)} L
        </h4>
        <table>
            <thead>
                <tr>
                    <th>Data</th>
                    <th>Veículo</th>
                    <th>Placa</th>
                    <th>Combustível</th>
                    <th style="text-align: right;">Litros</th>
                    <th style="text-align: right;">KM</th>
                    <th style="text-align: right;">Valor</th>
                    <th style="text-align: right;">R$/L</th>
                </tr>
            </thead>
            <tbody>
    `;

    abastecimentos.forEach(a => {
        const dataStr = formatarDataParaExibicao(a.data);
        const precoLitro = a.litros > 0 ? (a.valor / a.litros) : 0;
        html += `
            <tr>
                <td>${dataStr}</td>
                <td>${a.veiculoNome || '-'}</td>
                <td><strong>${a.veiculoPlaca || '-'}</strong></td>
                <td>${combustivelLabels[a.combustivel] || a.combustivel}</td>
                <td style="text-align: right;">${(a.litros || 0).toFixed(1)}</td>
                <td style="text-align: right;">${a.km || 0}</td>
                <td style="text-align: right; font-weight: 600;">R$ ${(a.valor || 0).toFixed(2)}</td>
                <td style="text-align: right;">R$ ${precoLitro.toFixed(2)}</td>
            </tr>
        `;
    });

    const mediaLitro = totalLitros > 0 ? (totalValor / totalLitros) : 0;
    html += `
            <tr class="total-row">
                <td colspan="3" style="text-align: right;">TOTAIS</td>
                <td style="text-align: right;">${abastecimentos.length} registros</td>
                <td style="text-align: right;"><strong>${totalLitros.toFixed(1)} L</strong></td>
                <td style="text-align: right;">-</td>
                <td style="text-align: right;"><strong>R$ ${totalValor.toFixed(2)}</strong></td>
                <td style="text-align: right;"><strong>R$ ${mediaLitro.toFixed(2)}/L</strong></td>
            </tr>
        </tbody></table>
    `;
    return html;
}

function renderizarTabelaMultas(multas) {
    if (multas.length === 0) return '';

    const tipoLabels = {
        'leve': '🟢 Leve',
        'media': '🟡 Média',
        'grave': '🟠 Grave',
        'gravissima': '🔴 Gravíssima'
    };

    const statusLabels = {
        'pendente': '⏳ Pendente',
        'pago': '✅ Pago',
        'contestando': '⚖️ Contestando',
        'vencido': '❌ Vencido'
    };

    let total = 0;
    let pendentes = 0;
    multas.forEach(m => {
        total += m.valor || 0;
        if (m.status === 'pendente' || m.status === 'vencido') pendentes++;
    });

    let html = `
        <h4 style="margin: 24px 0 12px; color: #0f172a; display: flex; align-items: center; gap: 8px;">
            <i class="fas fa-gavel" style="color: #ef4444;"></i>
            Multas (${multas.length}) - Total: R$ ${total.toFixed(2)} | Pendentes: ${pendentes}
        </h4>
        <table>
            <thead>
                <tr>
                    <th>Data</th>
                    <th>Veículo</th>
                    <th>Placa</th>
                    <th>Número</th>
                    <th>Tipo</th>
                    <th>Status</th>
                    <th>Descrição</th>
                    <th style="text-align: right;">Valor</th>
                </tr>
            </thead>
            <tbody>
    `;

    multas.forEach(m => {
        const dataStr = formatarDataParaExibicao(m.data);
        const statusColor = m.status === 'vencido' ? '#dc2626' : '#1e293b';
        html += `
            <tr>
                <td>${dataStr}</td>
                <td>${m.veiculoNome || '-'}</td>
                <td><strong>${m.veiculoPlaca || '-'}</strong></td>
                <td>${m.numero || '-'}</td>
                <td>${tipoLabels[m.tipo] || m.tipo}</td>
                <td style="color: ${statusColor}; font-weight: 600;">${statusLabels[m.status] || m.status}</td>
                <td>${m.descricao || '-'}</td>
                <td style="text-align: right; font-weight: 600;">R$ ${(m.valor || 0).toFixed(2)}</td>
            </tr>
        `;
    });

    html += `
            <tr class="total-row">
                <td colspan="7" style="text-align: right;">TOTAL MULTAS</td>
                <td style="text-align: right;">R$ ${total.toFixed(2)}</td>
            </tr>
        </tbody></table>
    `;
    return html;
}

// ==================== ATUALIZAR DASHBOARD ====================
function atualizarDashboardRelatorio(dados) {
    document.getElementById('relTotalVeiculos').textContent = dados.veiculos.length;
    document.getElementById('relTotalManutencoes').textContent = dados.manutencoes.length;
    document.getElementById('relTotalAbastecimentos').textContent = dados.abastecimentos.length;
    document.getElementById('relTotalMultas').textContent = dados.multas.length;
    document.getElementById('relTotalGasto').textContent = `R$ ${dados.totalGasto.toFixed(2)}`;
}

// ==================== GET TIPO LABEL ====================
function getTipoLabel(tipo) {
    const labels = {
        'geral': 'Relatório Geral da Frota',
        'manutencoes': 'Relatório de Manutenções',
        'abastecimentos': 'Relatório de Abastecimentos',
        'multas': 'Relatório de Multas',
        'completo': 'Relatório Completo da Frota'
    };
    return labels[tipo] || 'Relatório da Frota';
}

// ==================== EXPORTAR EXCEL ====================
function exportarRelatorioExcel() {
    if (!relatorioDadosCache) {
        mostrarNotificacao('⚠️ Gere um relatório antes de exportar.', 'warning');
        return;
    }

    const dados = relatorioDadosCache;
    const wb = XLSX.utils.book_new();
    const tipo = document.getElementById('relatorioTipo').value;
    
    // 1. Criar aba de Resumo
    const resumoData = [
        ['RELATÓRIO DA FROTA'],
        [''],
        ['Período:', `${formatarDataParaExibicaoSimples(dados.periodo.inicio)} até ${formatarDataParaExibicaoSimples(dados.periodo.fim)}`],
        ['Data de Geração:', new Date().toLocaleString('pt-BR')],
        ['Tipo:', getTipoLabel(tipo)],
        [''],
        ['RESUMO GERAL'],
        ['Indicador', 'Valor'],
        ['Total de Veículos', dados.veiculos.length],
        ['Total de Manutenções', dados.manutencoes.length],
        ['Total de Abastecimentos', dados.abastecimentos.length],
        ['Total de Multas', dados.multas.length],
        ['Total Gasto (R$)', dados.totalGasto.toFixed(2)]
    ];
    const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
    wsResumo['!cols'] = [{ wch: 25 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');

    // 2. Aba de Veículos
    if (dados.veiculos.length > 0) {
        const veiculosData = [
            ['VEÍCULOS DA FROTA'],
            [''],
            ['Marca', 'Modelo', 'Placa', 'Ano', 'Cor', 'KM Atual', 'Status']
        ];
        dados.veiculos.forEach(v => {
            veiculosData.push([
                v.marca || '-',
                v.modelo || '-',
                v.placa || '-',
                v.ano || '-',
                v.cor || '-',
                v.kmAtual || 0,
                v.ativo !== false ? 'Ativo' : 'Inativo'
            ]);
        });
        const wsVeiculos = XLSX.utils.aoa_to_sheet(veiculosData);
        wsVeiculos['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 }];
        XLSX.utils.book_append_sheet(wb, wsVeiculos, 'Veículos');
    }

    // 3. Aba de Manutenções
    if (dados.manutencoes.length > 0) {
        const manutData = [
            ['MANUTENÇÕES'],
            [''],
            ['Data', 'Veículo', 'Placa', 'Tipo', 'Descrição', 'Responsável', 'KM', 'Valor (R$)']
        ];
        let totalManut = 0;
        dados.manutencoes.forEach(m => {
            totalManut += m.valor || 0;
            manutData.push([
                formatarDataParaExibicao(m.data),
                m.veiculoNome || '-',
                m.veiculoPlaca || '-',
                m.tipo || '-',
                m.descricao || '-',
                m.responsavel || '-',
                m.km || 0,
                (m.valor || 0).toFixed(2)
            ]);
        });
        manutData.push(['', '', '', '', '', '', 'TOTAL:', totalManut.toFixed(2)]);
        const wsManut = XLSX.utils.aoa_to_sheet(manutData);
        wsManut['!cols'] = [{ wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 25 }, { wch: 18 }, { wch: 10 }, { wch: 14 }];
        XLSX.utils.book_append_sheet(wb, wsManut, 'Manutenções');
    }

    // 4. Aba de Abastecimentos
    if (dados.abastecimentos.length > 0) {
        const abastData = [
            ['ABASTECIMENTOS'],
            [''],
            ['Data', 'Veículo', 'Placa', 'Combustível', 'Litros', 'KM', 'Valor (R$)', 'R$/L']
        ];
        let totalValor = 0, totalLitros = 0;
        dados.abastecimentos.forEach(a => {
            totalValor += a.valor || 0;
            totalLitros += a.litros || 0;
            abastData.push([
                formatarDataParaExibicao(a.data),
                a.veiculoNome || '-',
                a.veiculoPlaca || '-',
                a.combustivel || '-',
                (a.litros || 0).toFixed(1),
                a.km || 0,
                (a.valor || 0).toFixed(2),
                a.litros > 0 ? (a.valor / a.litros).toFixed(2) : '0.00'
            ]);
        });
        abastData.push(['', '', '', '', 'TOTAL:', totalLitros.toFixed(1), totalValor.toFixed(2), '']);
        const wsAbast = XLSX.utils.aoa_to_sheet(abastData);
        wsAbast['!cols'] = [{ wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 10 }, { wch: 14 }, { wch: 12 }];
        XLSX.utils.book_append_sheet(wb, wsAbast, 'Abastecimentos');
    }

    // 5. Aba de Multas
    if (dados.multas.length > 0) {
        const multasData = [
            ['MULTAS'],
            [''],
            ['Data', 'Veículo', 'Placa', 'Número', 'Tipo', 'Status', 'Descrição', 'Valor (R$)']
        ];
        let totalMultas = 0;
        dados.multas.forEach(m => {
            totalMultas += m.valor || 0;
            multasData.push([
                formatarDataParaExibicao(m.data),
                m.veiculoNome || '-',
                m.veiculoPlaca || '-',
                m.numero || '-',
                m.tipo || '-',
                m.status || '-',
                m.descricao || '-',
                (m.valor || 0).toFixed(2)
            ]);
        });
        multasData.push(['', '', '', '', '', '', 'TOTAL:', totalMultas.toFixed(2)]);
        const wsMultas = XLSX.utils.aoa_to_sheet(multasData);
        wsMultas['!cols'] = [{ wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 25 }, { wch: 14 }];
        XLSX.utils.book_append_sheet(wb, wsMultas, 'Multas');
    }

    // Salvar arquivo
    const hoje = new Date().toISOString().split('T')[0];
    const nomeArquivo = `relatorio_frota_${hoje}.xlsx`;
    XLSX.writeFile(wb, nomeArquivo);
    mostrarNotificacao('✅ Relatório exportado para Excel com sucesso!', 'success');
}

// ==================== EXPORTAR PDF (CORRIGIDO) ====================
function exportarRelatorioPDF() {
    if (!relatorioDadosCache) {
        mostrarNotificacao('⚠️ Gere um relatório antes de exportar.', 'warning');
        return;
    }

    const dados = relatorioDadosCache;
    const tipo = document.getElementById('relatorioTipo').value;
    const dataInicio = dados.periodo.inicio;
    const dataFim = dados.periodo.fim;
    const nomeEmpresa = 'Novetech';
    const tituloRelatorio = getTipoLabel(tipo);

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    let y = 15;

    // ========== FUNÇÃO PARA ADICIONAR CABEÇALHO ==========
    function addHeader(doc, pageNum, totalPages) {
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('Página ' + pageNum + ' de ' + totalPages, pageWidth - margin - 25, 8);
        doc.text('Gerado em: ' + new Date().toLocaleString('pt-BR'), margin, 8);
    }

    // ========== FUNÇÃO PARA ADICIONAR RODAPÉ ==========
    function addFooter(doc) {
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(nomeEmpresa + ' - Sistema de Gestão de Frota', pageWidth / 2, pageHeight - 8, { align: 'center' });
    }

    // ========== PÁGINA DE TÍTULO ==========
    doc.setFontSize(24);
    doc.setTextColor(37, 99, 235);
    doc.text('RELATÓRIO DA FROTA', pageWidth / 2, 50, { align: 'center' });

    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.text(tituloRelatorio, pageWidth / 2, 68, { align: 'center' });

    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.text('Período: ' + formatarDataParaExibicaoSimples(dataInicio) + ' até ' + formatarDataParaExibicaoSimples(dataFim), pageWidth / 2, 80, { align: 'center' });
    doc.text('Data de Geração: ' + new Date().toLocaleString('pt-BR'), pageWidth / 2, 88, { align: 'center' });

    doc.setDrawColor(37, 99, 235);
    doc.line(margin, 95, pageWidth - margin, 95);

    // ========== RESUMO ==========
    y = 105;
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text('RESUMO GERAL', margin, y);
    y += 8;

    const resumoData = [
        ['Indicador', 'Valor'],
        ['Total de Veículos', String(dados.veiculos.length)],
        ['Total de Manutenções', String(dados.manutencoes.length)],
        ['Total de Abastecimentos', String(dados.abastecimentos.length)],
        ['Total de Multas', String(dados.multas.length)],
        ['Total Gasto (R$)', dados.totalGasto.toFixed(2)]
    ];

    doc.autoTable({
        startY: y,
        head: [resumoData[0]],
        body: resumoData.slice(1),
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontSize: 10 },
        bodyStyles: { fontSize: 9 },
        columnStyles: {
            0: { cellWidth: 80 },
            1: { cellWidth: 60, halign: 'right' }
        },
        margin: { left: margin, right: margin },
        didDrawPage: function(data) {
            addFooter(doc);
        }
    });

    // ========== VEÍCULOS ==========
    if (dados.veiculos.length > 0) {
        doc.addPage();
        addHeader(doc, doc.internal.getNumberOfPages(), doc.internal.getNumberOfPages());
        y = 20;

        doc.setFontSize(14);
        doc.setTextColor(30, 41, 59);
        doc.text('Veículos da Frota (' + dados.veiculos.length + ')', margin, y);
        y += 8;

        const veiculosData = dados.veiculos.map(v => [
            v.marca || '-',
            v.modelo || '-',
            v.placa || '-',
            v.ano || '-',
            v.cor || '-',
            String(v.kmAtual || 0) + ' km',
            v.ativo !== false ? 'Ativo' : 'Inativo'
        ]);

        doc.autoTable({
            startY: y,
            head: [['Marca', 'Modelo', 'Placa', 'Ano', 'Cor', 'KM Atual', 'Status']],
            body: veiculosData,
            theme: 'striped',
            headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontSize: 9 },
            bodyStyles: { fontSize: 8 },
            columnStyles: {
                0: { cellWidth: 30 },
                1: { cellWidth: 30 },
                2: { cellWidth: 25 },
                3: { cellWidth: 18 },
                4: { cellWidth: 22 },
                5: { cellWidth: 25 },
                6: { cellWidth: 25 }
            },
            margin: { left: margin, right: margin },
            didDrawPage: function(data) {
                addFooter(doc);
            }
        });
    }

    // ========== MANUTENÇÕES ==========
    if (dados.manutencoes.length > 0) {
        doc.addPage();
        addHeader(doc, doc.internal.getNumberOfPages(), doc.internal.getNumberOfPages());
        y = 20;

        const totalManut = dados.manutencoes.reduce(function(s, m) { return s + (m.valor || 0); }, 0);
        doc.setFontSize(14);
        doc.setTextColor(30, 41, 59);
        doc.text('Manutenções (' + dados.manutencoes.length + ') - Total: R$ ' + totalManut.toFixed(2), margin, y);
        y += 8;

        const manutData = dados.manutencoes.map(function(m) {
            return [
                formatarDataParaExibicao(m.data),
                m.veiculoNome || '-',
                m.veiculoPlaca || '-',
                m.tipo || '-',
                m.descricao || '-',
                m.responsavel || '-',
                String(m.km || 0),
                'R$ ' + (m.valor || 0).toFixed(2)
            ];
        });

        doc.autoTable({
            startY: y,
            head: [['Data', 'Veículo', 'Placa', 'Tipo', 'Descrição', 'Responsável', 'KM', 'Valor']],
            body: manutData,
            theme: 'striped',
            headStyles: { fillColor: [245, 158, 11], textColor: [255, 255, 255], fontSize: 8 },
            bodyStyles: { fontSize: 7 },
            columnStyles: {
                0: { cellWidth: 20 },
                1: { cellWidth: 30 },
                2: { cellWidth: 22 },
                3: { cellWidth: 25 },
                4: { cellWidth: 40 },
                5: { cellWidth: 28 },
                6: { cellWidth: 18 },
                7: { cellWidth: 22, halign: 'right' }
            },
            margin: { left: margin, right: margin },
            didDrawPage: function(data) {
                addFooter(doc);
            }
        });
    }

    // ========== ABASTECIMENTOS ==========
    if (dados.abastecimentos.length > 0) {
        doc.addPage();
        addHeader(doc, doc.internal.getNumberOfPages(), doc.internal.getNumberOfPages());
        y = 20;

        var totalValor = 0;
        var totalLitros = 0;
        dados.abastecimentos.forEach(function(a) {
            totalValor += a.valor || 0;
            totalLitros += a.litros || 0;
        });
        doc.setFontSize(14);
        doc.setTextColor(30, 41, 59);
        doc.text('Abastecimentos (' + dados.abastecimentos.length + ') - Total: R$ ' + totalValor.toFixed(2) + ' | ' + totalLitros.toFixed(1) + ' L', margin, y);
        y += 8;

        var abastData = dados.abastecimentos.map(function(a) {
            return [
                formatarDataParaExibicao(a.data),
                a.veiculoNome || '-',
                a.veiculoPlaca || '-',
                a.combustivel || '-',
                (a.litros || 0).toFixed(1) + ' L',
                String(a.km || 0),
                'R$ ' + (a.valor || 0).toFixed(2),
                'R$ ' + (a.litros > 0 ? (a.valor / a.litros).toFixed(2) : '0.00')
            ];
        });

        doc.autoTable({
            startY: y,
            head: [['Data', 'Veículo', 'Placa', 'Combustível', 'Litros', 'KM', 'Valor', 'R$/L']],
            body: abastData,
            theme: 'striped',
            headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontSize: 8 },
            bodyStyles: { fontSize: 7 },
            columnStyles: {
                0: { cellWidth: 20 },
                1: { cellWidth: 30 },
                2: { cellWidth: 22 },
                3: { cellWidth: 22 },
                4: { cellWidth: 18 },
                5: { cellWidth: 18 },
                6: { cellWidth: 22, halign: 'right' },
                7: { cellWidth: 20, halign: 'right' }
            },
            margin: { left: margin, right: margin },
            didDrawPage: function(data) {
                addFooter(doc);
            }
        });
    }

    // ========== MULTAS ==========
    if (dados.multas.length > 0) {
        doc.addPage();
        addHeader(doc, doc.internal.getNumberOfPages(), doc.internal.getNumberOfPages());
        y = 20;

        var totalMultas = 0;
        var pendentes = 0;
        dados.multas.forEach(function(m) {
            totalMultas += m.valor || 0;
            if (m.status === 'pendente' || m.status === 'vencido') pendentes++;
        });
        doc.setFontSize(14);
        doc.setTextColor(30, 41, 59);
        doc.text('Multas (' + dados.multas.length + ') - Total: R$ ' + totalMultas.toFixed(2) + ' | Pendentes: ' + pendentes, margin, y);
        y += 8;

        var multasData = dados.multas.map(function(m) {
            return [
                formatarDataParaExibicao(m.data),
                m.veiculoNome || '-',
                m.veiculoPlaca || '-',
                m.numero || '-',
                m.tipo || '-',
                m.status || '-',
                m.descricao || '-',
                'R$ ' + (m.valor || 0).toFixed(2)
            ];
        });

        doc.autoTable({
            startY: y,
            head: [['Data', 'Veículo', 'Placa', 'Número', 'Tipo', 'Status', 'Descrição', 'Valor']],
            body: multasData,
            theme: 'striped',
            headStyles: { fillColor: [239, 68, 68], textColor: [255, 255, 255], fontSize: 8 },
            bodyStyles: { fontSize: 7 },
            columnStyles: {
                0: { cellWidth: 20 },
                1: { cellWidth: 28 },
                2: { cellWidth: 20 },
                3: { cellWidth: 22 },
                4: { cellWidth: 20 },
                5: { cellWidth: 22 },
                6: { cellWidth: 35 },
                7: { cellWidth: 22, halign: 'right' }
            },
            margin: { left: margin, right: margin },
            didDrawPage: function(data) {
                addFooter(doc);
            }
        });
    }

    // ========== SALVAR PDF ==========
    var hoje = new Date().toISOString().split('T')[0];
    var nomeArquivo = 'relatorio_frota_' + hoje + '.pdf';
    doc.save(nomeArquivo);
    mostrarNotificacao('✅ Relatório exportado para PDF com sucesso!', 'success');
}

// ==================== IMPRIMIR RELATÓRIO ====================
function imprimirRelatorio() {
    if (!relatorioDadosCache) {
        mostrarNotificacao('⚠️ Gere um relatório antes de imprimir.', 'warning');
        return;
    }
    window.print();
}

// ==================== EXPOR FUNÇÕES ====================
window.gerarRelatorioFrota = gerarRelatorioFrota;
window.exportarRelatorioExcel = exportarRelatorioExcel;
window.exportarRelatorioPDF = exportarRelatorioPDF;
window.imprimirRelatorio = imprimirRelatorio;
window.definirPeriodoHoje = definirPeriodoHoje;
window.definirPeriodoSemana = definirPeriodoSemana;
window.definirPeriodoMes = definirPeriodoMes;
window.definirPeriodoUltimos30Dias = definirPeriodoUltimos30Dias;
window.buscarDadosRelatorio = buscarDadosRelatorio;
window.renderizarRelatorio = renderizarRelatorio;
window.atualizarDashboardRelatorio = atualizarDashboardRelatorio;

console.log('✅ Módulo de Relatórios da Frota carregado!');