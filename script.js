let perfilAtualTipo = null;
let modoAuthAtual = 'login';
let usuarioTemporarioCadastro = null;
let pinGeradoAtual = null;
let usuarioEmRecuperacao = null;

const ESCOLAS_DISPONIVEIS = [
    "EREM Professor Epitácio André Dias - Cajueiro Seco, Prazeres, Jaboatão dos Guararapes"
];

const FOTO_PADRAO = 'https://via.placeholder.com/150';

const PALAVRAS_PROIBIDAS = [
    "merda", "bosta", "puta", "puto", "caralho", "porra", "pica", "pau",
    "foder", "foda", "fodase", "fodeu", "desgraça", "maldito", "vagabundo",
    "vagabunda", "arrombado", "arrombada", "otario", "otaria", "imbecil",
    "idiota", "babaca", "cacete", "piranha", "cu",
    "fdp", "pnc", "vtnc", "vsf", "vtff", "pqp", "krl", "krlh",
    "prr", "tnc", "sfd"
];

window.addEventListener('DOMContentLoaded', () => {
    const temaGlobal = localStorage.getItem('tema_preferido');
    if (temaGlobal) {
        aplicarTema(temaGlobal === 'escuro');
    } else {
        const sessaoSalva = localStorage.getItem('usuario_sessao');
        if (sessaoSalva) {
            try {
                const usuario = JSON.parse(sessaoSalva);
                aplicarTema(usuario.modoEscuro || false);
            } catch(e) {}
        }
    }

    const sessaoSalva = localStorage.getItem('usuario_sessao');
    if (sessaoSalva) {
        try {
            const usuario = JSON.parse(sessaoSalva);
            entrarNoSistema(usuario);
        } catch(e) {}
    }
});

function mostrarAlerta(texto, erro = false) {
    const alerta = document.getElementById('alerta-sistema');
    if (!alerta) return;
    alerta.textContent = texto;
    alerta.className = 'alerta-sistema' + (erro ? ' erro' : '');
    alerta.classList.remove('hidden');
    setTimeout(() => {
        alerta.classList.add('hidden');
    }, 4500);
}

function contemConteudoImproprio(texto) {
    if (!texto) return false;
    const textoMinusculo = texto.toLowerCase();
    for (let palavra of PALAVRAS_PROIBIDAS) {
        if (textoMinusculo.includes(palavra)) {
            return true;
        }
    }
    return false;
}

function abrirTelaSobreProjeto() {
    esconderTodasTelas();
    document.getElementById('tela-sobre').classList.remove('hidden');
    manterTemaAtual();
    mudarSecaoSobre('historia');
}

function mudarSecaoSobre(secao) {
    document.getElementById('secao-sobre-historia').classList.add('hidden');
    document.getElementById('secao-sobre-propostas').classList.add('hidden');
    document.getElementById('secao-sobre-mural').classList.add('hidden');

    const botoes = document.querySelectorAll('#tela-sobre .nav-btn');
    botoes.forEach(btn => btn.classList.remove('active'));

    if (secao === 'historia') {
        document.getElementById('secao-sobre-historia').classList.remove('hidden');
        botoes[0].classList.add('active');
    } else if (secao === 'propostas') {
        document.getElementById('secao-sobre-propostas').classList.remove('hidden');
        botoes[1].classList.add('active');
    } else if (secao === 'mural') {
        document.getElementById('secao-sobre-mural').classList.remove('hidden');
        botoes[2].classList.add('active');
        carregarIdeiasPublicas();
    }
    manterTemaAtual();
}

function escolherPerfil(tipo) {
    perfilAtualTipo = tipo;
    esconderTodasTelas();
    document.getElementById('tela-auth').classList.remove('hidden');
    mudarAbaAuth('login');
}

function esconderTodasTelas() {
    const ids = ['tela-escolha', 'tela-auth', 'tela-esqueci-senha', 'tela-aluno', 'tela-professor', 'tela-coordenador', 'tela-sobre'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });
}

function voltarParaEscolha() {
    usuarioTemporarioCadastro = null;
    esconderTodasTelas();
    document.getElementById('tela-escolha').classList.remove('hidden');
    manterTemaAtual();
}

function voltarParaAuth() {
    esconderTodasTelas();
    document.getElementById('tela-auth').classList.remove('hidden');
    manterTemaAtual();
}

function mudarAbaAuth(modo) {
    modoAuthAtual = modo;
    usuarioTemporarioCadastro = null;
    const tabLogin = document.getElementById('tab-login');
    const tabCadastro = document.getElementById('tab-cadastro');
    const formContainer = document.getElementById('form-auth');
    const boxLembrar = document.getElementById('box-lembrar');

    let nomePerfilFormatado = perfilAtualTipo.charAt(0).toUpperCase() + perfilAtualTipo.slice(1);
    let classeBotao = `btn-auth-submit-${perfilAtualTipo}`;

    const emailPreenchido = localStorage.getItem(`ultimo_email_${perfilAtualTipo}`) || '';
    const senhaPreenchida = localStorage.getItem(`ultimo_senha_${perfilAtualTipo}`) || '';

    if (modo === 'login') {
        tabLogin.classList.add('active');
        tabCadastro.classList.remove('active');
        boxLembrar.classList.remove('hidden');
        document.getElementById('auth-titulo').textContent = `Login - ${nomePerfilFormatado}`;
        
        formContainer.innerHTML = `
            <input type="email" id="auth-email" placeholder="E-mail" value="${emailPreenchido}">
            <input type="password" id="auth-senha" placeholder="Senha" value="${senhaPreenchida}">
            <button class="btn-esqueceu-senha" onclick="abrirTelaEsqueciSenha()">Esqueceu a senha? Clique aqui</button>
            <button class="${classeBotao}" onclick="fazerLogin()">Entrar</button>
        `;
    } else {
        tabCadastro.classList.add('active');
        tabLogin.classList.remove('active');
        boxLembrar.classList.add('hidden');
        document.getElementById('auth-titulo').textContent = `Cadastro - ${nomePerfilFormatado}`;
        
        let placeholderEmail = (perfilAtualTipo === 'aluno') ? 'E-mail *' : 'E-mail corporativo / institucional *';

        formContainer.innerHTML = `
            <input type="text" id="auth-nome" placeholder="Nome completo *">
            <input type="email" id="auth-email" placeholder="${placeholderEmail}">
            <input type="password" id="auth-senha" placeholder="Senha *">
            <div class="campo-label-box">
                <input type="file" id="auth-foto" accept="image/*">
                <span class="texto-vermelho-opcional">opcional*</span>
            </div>
            <button class="${classeBotao}" onclick="fazerProximaEtapaCadastro()">Continuar</button>
        `;
    }
    manterTemaAtual();
}

function abrirTelaEsqueciSenha() {
    esconderTodasTelas();
    document.getElementById('tela-esqueci-senha').classList.remove('hidden');
    document.getElementById('rec-email').value = '';
    document.getElementById('box-pin-secao').classList.add('hidden');
    document.getElementById('rec-pin-input').value = '';
    document.getElementById('rec-nova-senha').value = '';
    document.getElementById('rec-confirma-senha').value = '';
    pinGeradoAtual = null;
    usuarioEmRecuperacao = null;
    manterTemaAtual();
}

function solicitarPinRecuperacao() {
    const email = document.getElementById('rec-email').value.trim();
    if (!email) {
        alert("Digite seu e-mail cadastrado.");
        return;
    }

    const usuarios = obterUsuarios();
    const usuario = usuarios.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!usuario) {
        mostrarAlerta("E-mail nunca usado. Redirecionando para o cadastro...", true);
        setTimeout(() => {
            mudarAbaAuth('cadastro');
            voltarParaAuth();
            const campoEmailCadastro = document.getElementById('auth-email');
            if (campoEmailCadastro) campoEmailCadastro.value = email;
        }, 1800);
        return;
    }

    usuarioEmRecuperacao = usuario;
    pinGeradoAtual = Math.floor(1000 + Math.random() * 9000).toString();

    document.getElementById('box-pin-secao').classList.remove('hidden');
    mostrarAlerta(`PIN enviado para ${email}! (CÓDIGO DE TESTE: ${pinGeradoAtual})`);
}

function reenviarPinRecuperacao() {
    if (!usuarioEmRecuperacao) {
        alert("Nenhum processo de recuperação em andamento.");
        return;
    }
    pinGeradoAtual = Math.floor(1000 + Math.random() * 9000).toString();
    document.getElementById('rec-pin-input').value = '';
    mostrarAlerta(`Novo PIN reenviado para ${usuarioEmRecuperacao.email}! (NOVO CÓDIGO DE TESTE: ${pinGeradoAtual})`);
}

function confirmarRedefinicaoSenhaComPin() {
    const pinDigitado = document.getElementById('rec-pin-input').value.trim();
    const novaSenha = document.getElementById('rec-nova-senha').value;
    const confirmaSenha = document.getElementById('rec-confirma-senha').value;

    if (!pinDigitado || pinDigitado !== pinGeradoAtual) {
        mostrarAlerta("PIN de 4 dígitos incorreto ou inválido!", true);
        return;
    }

    if (!novaSenha || novaSenha !== confirmaSenha) {
        alert("A nova senha e a confirmação não conferem.");
        return;
    }

    let usuarios = obterUsuarios();
    usuarios = usuarios.map(u => {
        if (u.email.toLowerCase() === usuarioEmRecuperacao.email.toLowerCase()) {
            u.senha = novaSenha;
        }
        return u;
    });

    localStorage.setItem('usuarios_portal', JSON.stringify(usuarios));

    const usuarioSessao = JSON.parse(localStorage.getItem('usuario_sessao') || '{}');
    if (usuarioSessao.email === usuarioEmRecuperacao.email) {
        usuarioSessao.senha = novaSenha;
        localStorage.setItem('usuario_sessao', JSON.stringify(usuarioSessao));
    }

    mostrarAlerta("Senha redefinida com sucesso! Faça seu login.");
    voltarParaAuth();
}

function obterUsuarios() {
    const dados = localStorage.getItem('usuarios_portal');
    return dados ? JSON.parse(dados) : [];
}

function fazerProximaEtapaCadastro() {
    const nome = document.getElementById('auth-nome').value.trim();
    const email = document.getElementById('auth-email').value.trim();
    const senha = document.getElementById('auth-senha').value;
    const inputFoto = document.getElementById('auth-foto');

    if (!nome || !email || !senha) {
        alert("Preencha todos os campos obrigatórios (Nome, E-mail e Senha).");
        return;
    }

    let usuarios = obterUsuarios();
    const jaExiste = usuarios.find(u => u.email.toLowerCase() === email.toLowerCase() && u.tipo === perfilAtualTipo);

    if (jaExiste) {
        alert("Já existe uma conta com este e-mail para este perfil.");
        return;
    }

    usuarioTemporarioCadastro = {
        tipo: perfilAtualTipo,
        nome: nome,
        email: email,
        senha: senha,
        foto: FOTO_PADRAO,
        biografia: '',
        anonimo: false,
        modoEscuro: document.body.classList.contains('modo-escuro')
    };

    if (inputFoto && inputFoto.files && inputFoto.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            usuarioTemporarioCadastro.foto = e.target.result;
            renderizarEtapa2Cadastro();
        };
        reader.readAsDataURL(inputFoto.files[0]);
    } else {
        renderizarEtapa2Cadastro();
    }
}

function renderizarEtapa2Cadastro() {
    const formContainer = document.getElementById('form-auth');
    document.getElementById('auth-titulo').textContent = `Dados Complementares`;
    let classeBotao = `btn-auth-submit-${perfilAtualTipo}`;

    let opcoesEscolaHtml = ESCOLAS_DISPONIVEIS.map(escola => `<option value="${escola}">${escola}</option>`).join('');

    formContainer.innerHTML = `
        <input type="number" id="auth-idade" placeholder="Sua Idade *" min="5" max="120">
        <div class="campo-label-box">
            <label class="label-pequeno">Selecione a sua Escola *</label>
            <select id="auth-escola" class="select-escola">
                ${opcoesEscolaHtml}
            </select>
        </div>
        <button class="${classeBotao}" onclick="concluirCadastroCompleto()">Finalizar Cadastro</button>
    `;
    manterTemaAtual();
}

function concluirCadastroCompleto() {
    const idade = document.getElementById('auth-idade').value.trim();
    const escola = document.getElementById('auth-escola').value;

    if (!idade) {
        alert("Por favor, preencha sua idade.");
        return;
    }

    usuarioTemporarioCadastro.idade = idade;
    usuarioTemporarioCadastro.escola = escola;

    let usuarios = obterUsuarios();
    usuarios.push(usuarioTemporarioCadastro);
    localStorage.setItem('usuarios_portal', JSON.stringify(usuarios));

    // CORREÇÃO: Salva a sessão imediatamente após o cadastro
    localStorage.setItem('usuario_sessao', JSON.stringify(usuarioTemporarioCadastro));

    mostrarAlerta("Conta criada com sucesso!");
    entrarNoSistema(usuarioTemporarioCadastro);
}

function fazerLogin() {
    const email = document.getElementById('auth-email').value.trim();
    const senha = document.getElementById('auth-senha').value;
    const checkLembrar = document.getElementById('check-lembrar');
    const manterSalvo = checkLembrar ? checkLembrar.checked : false;

    if (!email || !senha) {
        alert("Preencha o e-mail e a senha.");
        return;
    }

    const usuarios = obterUsuarios();
    const usuario = usuarios.find(u => u.email.toLowerCase() === email.toLowerCase() && u.senha === senha && u.tipo === perfilAtualTipo);

    if (!usuario) {
        const existeGeral = usuarios.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!existeGeral) {
            mostrarAlerta("E-mail nunca usado. Redirecionando para o cadastro...", true);
            setTimeout(() => {
                mudarAbaAuth('cadastro');
                const campoEmailCadastro = document.getElementById('auth-email');
                if (campoEmailCadastro) campoEmailCadastro.value = email;
            }, 1800);
            return;
        }
        mostrarAlerta("Senha ou tipo de conta incorretos.", true);
        return;
    }

    if (manterSalvo) {
        localStorage.setItem(`ultimo_email_${perfilAtualTipo}`, email);
        localStorage.setItem(`ultimo_senha_${perfilAtualTipo}`, senha);
        salvarSessaoSeLembrar(usuario);
    } else {
        localStorage.removeItem(`ultimo_email_${perfilAtualTipo}`);
        localStorage.removeItem(`ultimo_senha_${perfilAtualTipo}`);
        localStorage.removeItem('usuario_sessao');
    }

    entrarNoSistema(usuario);
}

function salvarSessaoSeLembrar(usuario) {
    localStorage.setItem('usuario_sessao', JSON.stringify(usuario));
}

function entrarNoSistema(usuario) {
    esconderTodasTelas();

    const tipo = usuario && usuario.tipo ? usuario.tipo : 'aluno';

    if (tipo === 'aluno') {
        document.getElementById('tela-aluno').classList.remove('hidden');
        carregarDadosPerfil(usuario, 'aluno');
        mudarSecaoAluno('menu');
    } else if (tipo === 'professor') {
        document.getElementById('tela-professor').classList.remove('hidden');
        carregarDadosPerfil(usuario, 'professor');
        mudarSecaoProfessor('agenda');
    } else {
        document.getElementById('tela-coordenador').classList.remove('hidden');
        carregarDadosPerfil(usuario, 'coordenador');
        mudarSecaoCoord('pendentes');
    }
    manterTemaAtual();
}

function carregarDadosPerfil(usuarioEntrada, tipo) {
    let usuario = usuarioEntrada;
    
    if (!usuario || !usuario.email) {
        const sessaoSalva = localStorage.getItem('usuario_sessao');
        if (sessaoSalva) {
            try {
                usuario = JSON.parse(sessaoSalva);
            } catch (e) {}
        }
    }

    if (!usuario || !usuario.email) {
        const usuarios = obterUsuarios();
        usuario = usuarios.find(u => u.tipo === tipo);
    }

    if (!usuario) {
        usuario = {
            nome: tipo === 'coordenador' ? 'Coordenação Pedagógica' : (tipo === 'professor' ? 'Professor(a)' : 'Aluno'),
            email: tipo === 'coordenador' ? 'coordenacao@escola.com' : 'email@escola.com',
            foto: FOTO_PADRAO,
            idade: '-',
            escola: 'EREM Epitácio André Dias',
            biografia: 'Nenhuma descrição adicionada ainda.',
            senha: '',
            anonimo: false
        };
    }

    const imgEl = document.getElementById(`perfil-img-${tipo}`);
    const nomeEl = document.getElementById(`perfil-nome-${tipo}`);
    const emailEl = document.getElementById(`perfil-email-${tipo}`);
    const idadeEl = document.getElementById(`perfil-idade-${tipo}`);
    const escolaEl = document.getElementById(`perfil-escola-${tipo}`);
    const bioEl = document.getElementById(`perfil-biografia-${tipo}`);

    const fotoUrl = (usuario.foto && usuario.foto.length > 10) ? usuario.foto : FOTO_PADRAO;

    if (imgEl) imgEl.src = fotoUrl;
    if (nomeEl) nomeEl.textContent = usuario.nome || '';
    if (emailEl) emailEl.textContent = usuario.email || '';
    if (idadeEl) idadeEl.textContent = `Idade: ${usuario.idade || '-'}`;
    if (escolaEl) escolaEl.textContent = `Escola: ${usuario.escola || 'EREM Epitácio André Dias'}`;
    if (bioEl) bioEl.textContent = usuario.biografia || 'Nenhuma descrição adicionada ainda.';

    const senhaTxt = document.getElementById(`perfil-senha-texto-${tipo}`);
    if (senhaTxt) {
        senhaTxt.textContent = '••••••••';
        senhaTxt.dataset.senhaReal = usuario.senha || '';
    }

    const checkAnonimo = document.getElementById(`check-anonimo-${tipo}`);
    if (checkAnonimo) {
        checkAnonimo.checked = usuario.anonimo || false;
        atualizarLabelAnonimoPerfil(tipo, usuario.anonimo || false);
    }
}

function toggleTema() {
    const isEscuro = document.body.classList.contains('modo-escuro');
    const novoEstado = !isEscuro;

    aplicarTema(novoEstado);
    localStorage.setItem('tema_preferido', novoEstado ? 'escuro' : 'claro');

    const sessaoStr = localStorage.getItem('usuario_sessao');
    if (sessaoStr) {
        try {
            let usuarioSessao = JSON.parse(sessaoStr);
            usuarioSessao.modoEscuro = novoEstado;
            localStorage.setItem('usuario_sessao', JSON.stringify(usuarioSessao));

            let usuarios = obterUsuarios();
            usuarios = usuarios.map(u => (u.email === usuarioSessao.email && u.tipo === usuarioSessao.tipo) ? usuarioSessao : u);
            localStorage.setItem('usuarios_portal', JSON.stringify(usuarios));
        } catch(e) {}
    }
}

function manterTemaAtual() {
    const temaGlobal = localStorage.getItem('tema_preferido');
    if (temaGlobal) {
        aplicarTema(temaGlobal === 'escuro');
    }
}

function aplicarTema(isEscuro) {
    if (isEscuro) {
        document.body.classList.remove('modo-claro');
        document.body.classList.add('modo-escuro');
    } else {
        document.body.classList.remove('modo-escuro');
        document.body.classList.add('modo-claro');
    }
}

function toggleModoAnonimoPerfil(tipo) {
    const checkbox = document.getElementById(`check-anonimo-${tipo}`);
    const isAnonimo = checkbox ? checkbox.checked : false;
    
    const sessaoStr = localStorage.getItem('usuario_sessao');
    if (!sessaoStr) return;
    let usuarioSessao = JSON.parse(sessaoStr);
    
    usuarioSessao.anonimo = isAnonimo;
    localStorage.setItem('usuario_sessao', JSON.stringify(usuarioSessao));

    let usuarios = obterUsuarios();
    usuarios = usuarios.map(u => (u.email === usuarioSessao.email && u.tipo === usuarioSessao.tipo) ? usuarioSessao : u);
    localStorage.setItem('usuarios_portal', JSON.stringify(usuarios));

    atualizarLabelAnonimoPerfil(tipo, isAnonimo);
    mostrarAlerta(isAnonimo ? "Modo anônimo ativado" : "Conta ativa");
}

function atualizarLabelAnonimoPerfil(tipo, isAnonimo) {
    const label = document.getElementById(`label-status-anonimo-${tipo}`);
    if (label) {
        label.textContent = isAnonimo ? "Anônima" : "Ativa";
    }
}

function abrirModalEdicao() {
    const sessao = JSON.parse(localStorage.getItem('usuario_sessao') || '{}');
    document.getElementById('input-novo-nome').value = sessao.nome || '';
    document.getElementById('input-nova-bio').value = sessao.biografia || '';
    document.getElementById('input-nova-foto').value = '';
    document.getElementById('modal-edicao').classList.remove('hidden');
}

function fecharModalEdicao() {
    document.getElementById('modal-edicao').classList.add('hidden');
}

function salvarEdicaoPerfil() {
    const novoNome = document.getElementById('input-novo-nome').value.trim();
    const novaBio = document.getElementById('input-nova-bio').value.trim();
    const inputFoto = document.getElementById('input-nova-foto');

    const sessaoStr = localStorage.getItem('usuario_sessao');
    if (!sessaoStr) return;
    let usuarioSessao = JSON.parse(sessaoStr);

    if (novoNome) usuarioSessao.nome = novoNome;
    usuarioSessao.biografia = novaBio;

    if (inputFoto && inputFoto.files && inputFoto.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            usuarioSessao.foto = e.target.result;
            finalizarAtualizacaoPerfil(usuarioSessao);
        };
        reader.readAsDataURL(inputFoto.files[0]);
    } else {
        finalizarAtualizacaoPerfil(usuarioSessao);
    }
}

function finalizarAtualizacaoPerfil(usuarioSessao) {
    localStorage.setItem('usuario_sessao', JSON.stringify(usuarioSessao));

    let usuarios = obterUsuarios();
    usuarios = usuarios.map(u => (u.email === usuarioSessao.email && u.tipo === usuarioSessao.tipo) ? usuarioSessao : u);
    localStorage.setItem('usuarios_portal', JSON.stringify(usuarios));

    carregarDadosPerfil(usuarioSessao, usuarioSessao.tipo);
    fecharModalEdicao();
    mostrarAlerta("Perfil atualizado com sucesso!");
}

function toggleMostrarSenha(tipo) {
    const spanSenha = document.getElementById(`perfil-senha-texto-${tipo}`);
    if (!spanSenha) return;
    const senhaReal = spanSenha.dataset.senhaReal;
    spanSenha.textContent = (spanSenha.textContent === '••••••••') ? senhaReal : '••••••••';
}

function toggleMudarSenhaForm(tipo) {
    const form = document.getElementById(`form-mudar-senha-${tipo}`);
    if (form) form.classList.toggle('hidden');
}

function salvarNovaSenha(tipo) {
    const antiga = document.getElementById(`senha-antiga-${tipo}`).value;
    const nova = document.getElementById(`senha-nova-${tipo}`).value;
    const confirma = document.getElementById(`senha-confirma-${tipo}`).value;

    let usuarioSessao = JSON.parse(localStorage.getItem('usuario_sessao') || '{}');

    if (antiga !== usuarioSessao.senha) {
        mostrarAlerta("Senha antiga incorreta", true);
        return;
    }

    if (!nova || nova !== confirma) {
        alert("A nova senha e a confirmação devem ser iguais.");
        return;
    }

    usuarioSessao.senha = nova;
    localStorage.setItem('usuario_sessao', JSON.stringify(usuarioSessao));

    let usuarios = obterUsuarios();
    usuarios = usuarios.map(u => (u.email === usuarioSessao.email && u.tipo === tipo) ? usuarioSessao : u);
    localStorage.setItem('usuarios_portal', JSON.stringify(usuarios));

    if (localStorage.getItem(`ultimo_email_${tipo}`)) {
        localStorage.setItem(`ultimo_senha_${tipo}`, nova);
    }

    toggleMudarSenhaForm(tipo);
    mostrarAlerta("Senha alterada com sucesso!");
}

function sairPerfil() {
    localStorage.removeItem('usuario_sessao');
    voltarParaEscolha();
}

function excluirConta() {
    if (!confirm("Tem certeza que deseja excluir sua conta permanentemente?")) return;

    const usuarioSessaoStr = localStorage.getItem('usuario_sessao');
    if (usuarioSessaoStr) {
        try {
            const usuarioSessao = JSON.parse(usuarioSessaoStr);
            let usuarios = obterUsuarios();
            usuarios = usuarios.filter(u => !(u.email === usuarioSessao.email && u.tipo === usuarioSessao.tipo));
            localStorage.setItem('usuarios_portal', JSON.stringify(usuarios));
            localStorage.removeItem(`ultimo_email_${usuarioSessao.tipo}`);
            localStorage.removeItem(`ultimo_senha_${usuarioSessao.tipo}`);
        } catch(e) {}
    }

    localStorage.removeItem('usuario_sessao');
    mostrarAlerta("Conta excluída com sucesso.", true);
    voltarParaEscolha();
}

// Navegação Aluno
function mudarSecaoAluno(secao) {
    document.getElementById('secao-aluno-menu').classList.add('hidden');
    document.getElementById('secao-aluno-ler').classList.add('hidden');
    document.getElementById('secao-aluno-votacao').classList.add('hidden');
    document.getElementById('secao-aluno-perfil').classList.add('hidden');

    const botoes = document.querySelectorAll('#tela-aluno .nav-btn');
    botoes.forEach(btn => btn.classList.remove('active'));

    if (secao === 'menu') {
        document.getElementById('secao-aluno-menu').classList.remove('hidden');
        botoes[0].classList.add('active');
    } else if (secao === 'ler') {
        document.getElementById('secao-aluno-ler').classList.remove('hidden');
        botoes[1].classList.add('active');
        carregarCartasAluno();
    } else if (secao === 'votacao') {
        document.getElementById('secao-aluno-votacao').classList.remove('hidden');
        botoes[2].classList.add('active');
        carregarEnquetesAluno();
    } else if (secao === 'perfil') {
        document.getElementById('secao-aluno-perfil').classList.remove('hidden');
        botoes[3].classList.add('active');
        carregarDadosPerfil(null, 'aluno');
    }
    manterTemaAtual();
}

// Navegação Professor
function mudarSecaoProfessor(secao) {
    document.getElementById('secao-professor-agenda').classList.add('hidden');
    document.getElementById('secao-professor-proposta').classList.add('hidden');
    document.getElementById('secao-professor-forum').classList.add('hidden');
    document.getElementById('secao-professor-perfil').classList.add('hidden');

    const botoes = document.querySelectorAll('#tela-professor .nav-btn');
    botoes.forEach(btn => btn.classList.remove('active'));

    if (secao === 'agenda') {
        document.getElementById('secao-professor-agenda').classList.remove('hidden');
        botoes[0].classList.add('active');
    } else if (secao === 'proposta') {
        document.getElementById('secao-professor-proposta').classList.remove('hidden');
        botoes[1].classList.add('active');
    } else if (secao === 'forum') {
        document.getElementById('secao-professor-forum').classList.remove('hidden');
        botoes[2].classList.add('active');
        carregarForumProfessores();
    } else if (secao === 'perfil') {
        document.getElementById('secao-professor-perfil').classList.remove('hidden');
        botoes[3].classList.add('active');
        carregarDadosPerfil(null, 'professor');
    }
    manterTemaAtual();
}

// Navegação Coordenação
function mudarSecaoCoord(secao) {
    document.getElementById('secao-coord-pendentes').classList.add('hidden');
    document.getElementById('secao-coord-andamento').classList.add('hidden');
    document.getElementById('secao-coord-aprovados').classList.add('hidden');
    document.getElementById('secao-coord-enquetes').classList.add('hidden');
    document.getElementById('secao-coord-perfil').classList.add('hidden');

    const botoes = document.querySelectorAll('#tela-coordenador .nav-btn');
    botoes.forEach(btn => btn.classList.remove('active'));

    if (secao === 'pendentes') {
        document.getElementById('secao-coord-pendentes').classList.remove('hidden');
        botoes[0].classList.add('active');
        carregarCartasCoordenador('pendente');
    } else if (secao === 'andamento') {
        document.getElementById('secao-coord-andamento').classList.remove('hidden');
        botoes[1].classList.add('active');
        carregarCartasCoordenador('andamento');
    } else if (secao === 'aprovados') {
        document.getElementById('secao-coord-aprovados').classList.remove('hidden');
        botoes[2].classList.add('active');
        carregarCartasCoordenador('concluido');
    } else if (secao === 'enquetes') {
        document.getElementById('secao-coord-enquetes').classList.remove('hidden');
        botoes[3].classList.add('active');
        carregarPainelEnqueteCoord();
    } else if (secao === 'perfil') {
        document.getElementById('secao-coord-perfil').classList.remove('hidden');
        botoes[4].classList.add('active');
        carregarDadosPerfil(null, 'coordenador');
    }
    manterTemaAtual();
}

// Banco de Dados Local (Mural Pré-carregado)
function obterCartas() {
    const cartasSalvas = localStorage.getItem('cartas_portal');
    return cartasSalvas ? JSON.parse(cartasSalvas) : [
        {
            id: 1,
            remetente: 'Prof. de Língua Portuguesa',
            origem: 'professor',
            texto: 'Solicitação de reserva do espaço dos cobogós para exibição de curtas-metragens com os 1ºs anos.',
            status: 'pendente',
            data: '12/10/2026'
        },
        {
            id: 2,
            remetente: 'Turma do 1º B',
            origem: 'aluno',
            texto: 'Criação de um laboratório de biologia e horta comunitária no descampado dos fundos.',
            status: 'concluido',
            data: '08/10/2026'
        },
        {
            id: 3,
            remetente: 'Estudante do 1º ano',
            origem: 'aluno',
            texto: 'Sugestão de mesas de estudo e leitura ao ar livre na sombra dos coqueiros do pátio principal.',
            status: 'andamento',
            data: '11/10/2026'
        },
        {
            id: 4,
            remetente: 'Grêmio / Estudantes',
            origem: 'aluno',
            texto: 'Proposta para transformar a área ociosa atrás da quadra em um anfiteatro para saraus e eventos culturais.',
            status: 'pendente',
            data: '10/10/2026'
        }
    ];
}

function salvarCartas(cartas) {
    localStorage.setItem('cartas_portal', JSON.stringify(cartas));
}

function enviarCarta() {
    const textarea = document.getElementById('texto-carta');
    const conteudo = textarea.value.trim();

    if (!conteudo) {
        alert("Escreva alguma proposta antes de enviar.");
        return;
    }

    if (contemConteudoImproprio(conteudo)) {
        mostrarAlerta("Erro: Sua mensagem contém termos impróprios ou ofensivos e não pode ser enviada.", true);
        return;
    }

    const sessao = JSON.parse(localStorage.getItem('usuario_sessao') || '{}');
    const cartas = obterCartas();

    cartas.push({
        id: Date.now(),
        remetente: sessao.anonimo ? 'Aluno Anônimo' : (sessao.nome || 'Aluno Idealista'),
        origem: 'aluno',
        texto: conteudo,
        status: 'pendente',
        data: new Date().toLocaleDateString('pt-BR')
    });

    salvarCartas(cartas);
    textarea.value = "";
    mostrarAlerta("Proposta enviada para a Coordenação!");
    mudarSecaoAluno('ler');
}

function solicitarReservaProf() {
    const espaco = document.getElementById('select-espaco-prof').value;
    const txt = document.getElementById('texto-agendamento-prof').value.trim();

    if (!txt) {
        alert("Descreva a aula antes de solicitar a reserva.");
        return;
    }

    if (contemConteudoImproprio(txt)) {
        mostrarAlerta("Erro: Termos inadequados detectados na descrição da aula.", true);
        return;
    }

    mostrarAlerta(`Reserva do espaço (${espaco}) realizada com sucesso!`);
    document.getElementById('texto-agendamento-prof').value = "";
}

function enviarProjetoProf() {
    const disciplina = document.getElementById('prof-disciplina').value.trim();
    const texto = document.getElementById('prof-texto-projeto').value.trim();

    if (!disciplina || !texto) {
        alert("Preencha a disciplina e a descrição do trabalho.");
        return;
    }

    if (contemConteudoImproprio(texto) || contemConteudoImproprio(disciplina)) {
        mostrarAlerta("Erro: Termos inadequados detectados no projeto.", true);
        return;
    }

    const sessao = JSON.parse(localStorage.getItem('usuario_sessao') || '{}');
    const cartas = obterCartas();

    cartas.push({
        id: Date.now(),
        remetente: `${sessao.anonimo ? 'Professor Anônimo' : (sessao.nome || 'Professor')} (${disciplina})`,
        origem: 'professor',
        texto: texto,
        status: 'pendente',
        data: new Date().toLocaleDateString('pt-BR')
    });

    salvarCartas(cartas);
    document.getElementById('prof-disciplina').value = "";
    document.getElementById('prof-texto-projeto').value = "";
    mostrarAlerta("Projeto docente enviado para o painel da Coordenação!");
}

/* ENQUETES E VOTAÇÕES COM DADOS PRÉ-CARREGADOS E VOTO DINÂMICO */
function obterEnquetesIniciais() {
    const enquetesSalvas = localStorage.getItem('enquetes_portal');
    if (enquetesSalvas) {
        return JSON.parse(enquetesSalvas);
    }

    const enquetePadrao = [
        {
            id: 101,
            titulo: 'Qual espaço do colégio devemos priorizar para a próxima revitalização?',
            opcoes: [
                'Espaço dos Cobogós (Mini Auditório / Cinema)',
                'Horta Pedagógica e Laboratório Vivo nos Fundos',
                'Cantinho de Leitura na Sombra dos Coqueiros',
                'Anfiteatro e Área Cultural Atrás da Quadra'
            ],
            votos: {
                'Espaço dos Cobogós (Mini Auditório / Cinema)': 18,
                'Horta Pedagógica e Laboratório Vivo nos Fundos': 12,
                'Cantinho de Leitura na Sombra dos Coqueiros': 25,
                'Anfiteatro e Área Cultural Atrás da Quadra': 15
            },
            votosUsuarios: {},
            ativa: true,
            data: '12/10/2026'
        }
    ];

    localStorage.setItem('enquetes_portal', JSON.stringify(enquetePadrao));
    return enquetePadrao;
}

function publicarEnqueteCoord() {
    const titulo = document.getElementById('coord-titulo-enquete').value.trim();
    const opcoesStr = document.getElementById('coord-opcoes-enquete').value.trim();

    if (!titulo || !opcoesStr) {
        alert("Preencha o título e as opções da enquete.");
        return;
    }

    if (contemConteudoImproprio(titulo) || contemConteudoImproprio(opcoesStr)) {
        mostrarAlerta("Erro: Termos inadequados na enquete.", true);
        return;
    }

    const opcoes = opcoesStr.split(',').map(op => op.trim()).filter(op => op.length > 0);

    let enquetes = obterEnquetesIniciais();
    enquetes.push({
        id: Date.now(),
        titulo: titulo,
        opcoes: opcoes,
        votos: {},
        votosUsuarios: {},
        ativa: true,
        data: new Date().toLocaleDateString('pt-BR')
    });

    localStorage.setItem('enquetes_portal', JSON.stringify(enquetes));
    document.getElementById('coord-titulo-enquete').value = '';
    document.getElementById('coord-opcoes-enquete').value = '';

    mostrarAlerta("Enquete publicada com sucesso!");
    carregarPainelEnqueteCoord();
}

function encerrarEnqueteCoord(idEnquete) {
    let enquetes = obterEnquetesIniciais();
    enquetes = enquetes.map(e => {
        if (e.id === idEnquete) {
            e.ativa = false;
        }
        return e;
    });
    localStorage.setItem('enquetes_portal', JSON.stringify(enquetes));
    mostrarAlerta("Votação encerrada! Os resultados finais foram publicados.");
    carregarPainelEnqueteCoord();
}

function carregarPainelEnqueteCoord() {
    const div = document.getElementById('painel-ultima-enquete-coord');
    if (!div) return;

    let enquetes = obterEnquetesIniciais();
    if (enquetes.length === 0) {
        div.innerHTML = '<p class="carta-data">Nenhuma enquete criada ainda.</p>';
        return;
    }

    const enq = enquetes[enquetes.length - 1];
    
    let totalVotos = 0;
    if (enq.votos) {
        enq.opcoes.forEach(op => {
            totalVotos += (enq.votos[op] || 0);
        });
    }

    let maiorVoto = -1;
    let opcaoVencedora = '';
    if (enq.votos) {
        enq.opcoes.forEach(op => {
            let qtd = enq.votos[op] || 0;
            if (qtd > maiorVoto) {
                maiorVoto = qtd;
                opcaoVencedora = op;
            }
        });
    }

    let resultadosHtml = enq.opcoes.map(op => {
        let qtd = (enq.votos && enq.votos[op]) ? enq.votos[op] : 0;
        let pct = totalVotos > 0 ? Math.round((qtd / totalVotos) * 100) : 0;
        let eGanhador = (op === opcaoVencedora && maiorVoto > 0);

        return `
            <div style="margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 700;">
                    <span>${escapeHtml(op)} ${eGanhador ? '<span class="badge-ganhador">🏆 Líder Atual</span>' : ''}</span>
                    <span>${pct}% (${qtd} votos)</span>
                </div>
                <div class="barra-resultado-container">
                    <div class="barra-resultado-preenchimento" style="width: ${pct}%;"></div>
                </div>
            </div>
        `;
    }).join('');

    div.innerHTML = `
        <div class="carta-box">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h4>${escapeHtml(enq.titulo)}</h4>
                <span class="badge-tipo" style="background: ${enq.ativa ? '#dcfce7' : '#fee2e2'}; color: ${enq.ativa ? '#15803d' : '#b91c1c'};">
                    ${enq.ativa ? 'EM ANDAMENTO' : 'ENCERRADA'}
                </span>
            </div>
            
            ${resultadosHtml}

            <span class="carta-data" style="display:block; margin-top:10px;">Total de Participantes: <strong>${totalVotos} alunos</strong></span>

            ${enq.ativa ? `
                <button class="btn-enviar" style="background: #ef4444; color: white; margin-top: 15px;" onclick="encerrarEnqueteCoord(${enq.id})">
                    🔒 Finalizar Votação e Definir Espaço Vencedor
                </button>
            ` : '<p style="color: #64748b; font-size: 12px; margin-top: 10px; font-style: italic;">Esta votação foi encerrada. Os resultados finais foram consolidados.</p>'}
        </div>
    `;
}

function carregarEnquetesAluno() {
    const div = document.getElementById('lista-enquetes-aluno');
    let enquetes = obterEnquetesIniciais();

    const sessaoStr = localStorage.getItem('usuario_sessao');
    let sessao = sessaoStr ? JSON.parse(sessaoStr) : {};
    let usuarioEmail = sessao.email;

    if (enquetes.length === 0) {
        div.innerHTML = '<p class="carta-data">Nenhuma enquete ativa no momento. Aguarde a Coordenação publicar!</p>';
        return;
    }

    div.innerHTML = '';
    enquetes.slice().reverse().forEach(enq => {
        let totalVotos = 0;
        if (enq.votos) {
            enq.opcoes.forEach(op => {
                totalVotos += (enq.votos[op] || 0);
            });
        }

        let maiorVoto = -1;
        let opcaoVencedora = '';
        if (enq.votos) {
            enq.opcoes.forEach(op => {
                let qtd = enq.votos[op] || 0;
                if (qtd > maiorVoto) {
                    maiorVoto = qtd;
                    opcaoVencedora = op;
                }
            });
        }

        let votoAtualUsuario = (enq.votosUsuarios && usuarioEmail) ? enq.votosUsuarios[usuarioEmail] : null;
        let opcoesHtml = '';

        if (enq.ativa) {
            opcoesHtml = enq.opcoes.map((op) => {
                let eMeuVoto = (op === votoAtualUsuario);
                return `
                    <div style="margin-top: 8px;">
                        <button class="btn-medio btn-opcao-voto" style="width: 100%; text-align: left; padding: 10px 14px; background: ${eMeuVoto ? '#10b981' : '#e2e8f0'}; color: ${eMeuVoto ? '#ffffff' : '#0f172a'}; border: ${eMeuVoto ? '2px solid #047857' : '1px solid #cbd5e1'}; font-weight: 600;" onclick="votarEnquete(${enq.id}, '${escapeHtml(op)}')">
                            🗳️ ${escapeHtml(op)} ${eMeuVoto ? '✓ (Seu Voto Registrado)' : ''}
                        </button>
                    </div>
                `;
            }).join('');
        } else {
            opcoesHtml = enq.opcoes.map((op) => {
                let qtd = (enq.votos && enq.votos[op]) ? enq.votos[op] : 0;
                let pct = totalVotos > 0 ? Math.round((qtd / totalVotos) * 100) : 0;
                let eGanhador = (op === opcaoVencedora && maiorVoto > 0);
                let eMeuVoto = (op === votoAtualUsuario);

                return `
                    <div style="margin-top: 10px;">
                        <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 700;">
                            <span>${escapeHtml(op)} ${eGanhador ? '<span class="badge-ganhador">🥇 GANHOU COM ' + pct + '%</span>' : ''} ${eMeuVoto ? '<span style="color:#10b981; margin-left:4px;">(Seu Voto)</span>' : ''}</span>
                            <span>${pct}% (${qtd} votos)</span>
                        </div>
                        <div class="barra-resultado-container">
                            <div class="barra-resultado-preenchimento" style="width: ${pct}%;"></div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        div.innerHTML += `
            <div class="carta-item">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <p style="margin-bottom:0;"><strong>${escapeHtml(enq.titulo)}</strong></p>
                    <span class="badge-tipo" style="background: ${enq.ativa ? '#dcfce7' : '#fee2e2'}; color: ${enq.ativa ? '#15803d' : '#b91c1c'};">
                        ${enq.ativa ? 'VOTAÇÃO ABERTA' : 'ENCERRADA'}
                    </span>
                </div>
                ${votoAtualUsuario && enq.ativa ? '<p style="font-size: 11px; color: #059669; font-weight: 700; margin-bottom: 6px;">✓ Sua conta já participou desta votação. Você pode mudar sua opção a qualquer momento!</p>' : ''}
                ${opcoesHtml}
                <span class="carta-data" style="display:block; margin-top:12px;">Publicado pela Coordenação em: ${enq.data} | Total de Votos: <strong>${totalVotos} estudantes</strong></span>
            </div>
        `;
    });
}

function votarEnquete(idEnquete, opcaoEscolhida) {
    const sessaoStr = localStorage.getItem('usuario_sessao');
    if (!sessaoStr) {
        mostrarAlerta("Você precisa estar logado para votar.", true);
        return;
    }
    let sessao = JSON.parse(sessaoStr);
    let usuarioEmail = sessao.email;

    let enquetes = obterEnquetesIniciais();
    let enqueteAlvo = enquetes.find(e => e.id === idEnquete);

    if (!enqueteAlvo) return;

    if (!enqueteAlvo.ativa) {
        mostrarAlerta("Esta votação já foi encerrada pela Coordenação!", true);
        return;
    }

    if (!enqueteAlvo.votosUsuarios) enqueteAlvo.votosUsuarios = {};
    if (!enqueteAlvo.votos) enqueteAlvo.votos = {};

    let votoAnterior = enqueteAlvo.votosUsuarios[usuarioEmail];

    if (votoAnterior === opcaoEscolhida) {
        mostrarAlerta("Sua conta já votou nesta opção!");
        return;
    }

    if (votoAnterior && enqueteAlvo.votos[votoAnterior] > 0) {
        enqueteAlvo.votos[votoAnterior]--;
    }

    enqueteAlvo.votosUsuarios[usuarioEmail] = opcaoEscolhida;
    enqueteAlvo.votos[opcaoEscolhida] = (enqueteAlvo.votos[opcaoEscolhida] || 0) + 1;

    enquetes = enquetes.map(e => e.id === idEnquete ? enqueteAlvo : e);
    localStorage.setItem('enquetes_portal', JSON.stringify(enquetes));

    if (votoAnterior) {
        mostrarAlerta(`Voto transferido de "${votoAnterior}" para "${opcaoEscolhida}"!`);
    } else {
        mostrarAlerta(`Voto computado em "${opcaoEscolhida}"!`);
    }

    carregarEnquetesAluno();
}

function postarForumProf() {
    const txt = document.getElementById('texto-forum-prof').value.trim();
    if (!txt) return;

    if (contemConteudoImproprio(txt)) {
        mostrarAlerta("Erro: O texto contém termos impróprios.", true);
        return;
    }

    const sessao = JSON.parse(localStorage.getItem('usuario_sessao') || '{}');
    let posts = JSON.parse(localStorage.getItem('forum_professores') || '[]');

    posts.push({
        autor: sessao.anonimo ? 'Professor Anônimo' : (sessao.nome || 'Professor'),
        texto: txt,
        data: new Date().toLocaleDateString('pt-BR')
    });

    localStorage.setItem('forum_professores', JSON.stringify(posts));
    document.getElementById('texto-forum-prof').value = "";
    carregarForumProfessores();
}

function carregarForumProfessores() {
    const div = document.getElementById('lista-forum-professores');
    let posts = JSON.parse(localStorage.getItem('forum_professores') || '[]');

    if (posts.length === 0) {
        div.innerHTML = '<p class="carta-data">Nenhuma postagem no fórum docente ainda.</p>';
        return;
    }

    div.innerHTML = '';
    posts.slice().reverse().forEach(p => {
        div.innerHTML += `
            <div class="carta-item">
                <p><strong>${escapeHtml(p.autor)}:</strong> ${escapeHtml(p.texto)}</p>
                <span class="carta-data">${p.data}</span>
            </div>
        `;
    });
}

function carregarCartasAluno() {
    const listaDiv = document.getElementById('lista-cartas-aluno');
    const cartas = obterCartas();

    listaDiv.innerHTML = '';
    cartas.slice().reverse().forEach(carta => {
        listaDiv.innerHTML += `
            <div class="carta-item">
                <span class="badge-tipo badge-${carta.origem === 'aluno' ? 'aluno' : 'prof'}">${carta.origem.toUpperCase()}</span>
                <p>${escapeHtml(carta.texto)}</p>
                <span class="carta-data">Status: <strong>${carta.status.toUpperCase()}</strong> | Enviado em: ${carta.data}</span>
            </div>
        `;
    });
}

function carregarCartasCoordenador(statusFiltro) {
    const cartas = obterCartas();
    let divAlvo = document.getElementById('lista-cartas-coordenador');

    if (statusFiltro === 'andamento') divAlvo = document.getElementById('lista-projetos-andamento');
    if (statusFiltro === 'concluido') divAlvo = document.getElementById('lista-projetos-concluidos');

    const filtradas = cartas.filter(c => c.status === statusFiltro);

    if (filtradas.length === 0) {
        divAlvo.innerHTML = '<p class="carta-data">Nenhum projeto registrado nesta categoria.</p>';
        return;
    }

    divAlvo.innerHTML = '';
    filtradas.slice().reverse().forEach(carta => {
        let botoesAcao = '';
        if (statusFiltro === 'pendente') {
            botoesAcao = `
                <div class="grupo-acoes-coord">
                    <button class="btn-coord-andamento" onclick="alterarStatusCarta(${carta.id}, 'andamento')">Mover p/ Em Andamento</button>
                    <button class="btn-coord-aprovar" onclick="alterarStatusCarta(${carta.id}, 'concluido')">Aprovar & Concluir</button>
                </div>
            `;
        } else if (statusFiltro === 'andamento') {
            botoesAcao = `
                <div class="grupo-acoes-coord">
                    <button class="btn-coord-aprovar" onclick="alterarStatusCarta(${carta.id}, 'concluido')">Marcar como Concluído</button>
                </div>
            `;
        }

        divAlvo.innerHTML += `
            <div class="carta-item">
                <span class="badge-tipo badge-${carta.origem === 'aluno' ? 'aluno' : 'prof'}">${carta.origem.toUpperCase()}</span>
                <p><strong>De: ${escapeHtml(carta.remetente)}</strong></p>
                <p>${escapeHtml(carta.texto)}</p>
                <span class="carta-data">Data: ${carta.data}</span>
                ${botoesAcao}
            </div>
        `;
    });
}

function alterarStatusCarta(id, novoStatus) {
    let cartas = obterCartas();
    cartas = cartas.map(c => c.id === id ? { ...c, status: novoStatus } : c);
    salvarCartas(cartas);
    mostrarAlerta(`Status do projeto atualizado para: ${novoStatus.toUpperCase()}`);
    mudarSecaoCoord(novoStatus === 'andamento' ? 'andamento' : 'aprovados');
}

function enviarIdeiaPublica() {
    const autorInput = document.getElementById('publico-nome-ideia').value.trim();
    const textoInput = document.getElementById('publico-texto-ideia').value.trim();

    if (!textoInput) {
        alert("Escreva uma ideia ou comentário antes de enviar!");
        return;
    }

    if (contemConteudoImproprio(textoInput) || contemConteudoImproprio(autorInput)) {
        mostrarAlerta("Erro: Termos inadequados na postagem do mural.", true);
        return;
    }

    const autor = autorInput ? autorInput : 'Comunidade Escolar';
    let ideias = JSON.parse(localStorage.getItem('ideias_publicas_patio') || '[]');

    ideias.push({
        autor: autor,
        texto: textoInput,
        data: new Date().toLocaleDateString('pt-BR')
    });

    localStorage.setItem('ideias_publicas_patio', JSON.stringify(ideias));
    document.getElementById('publico-nome-ideia').value = '';
    document.getElementById('publico-texto-ideia').value = '';
    mostrarAlerta("Sua ideia foi publicada no mural!");
    carregarIdeiasPublicas();
}

function carregarIdeiasPublicas() {
    const div = document.getElementById('lista-ideias-publicas');
    if (!div) return;

    let ideias = JSON.parse(localStorage.getItem('ideias_publicas_patio') || '[]');

    if (ideias.length === 0) {
        div.innerHTML = '<p class="carta-data">Nenhuma sugestão enviada ainda. Seja o primeiro a opinar!</p>';
        return;
    }

    div.innerHTML = '';
    ideias.slice().reverse().forEach(item => {
        div.innerHTML += `
            <div class="carta-item" style="padding: 10px; margin-bottom: 8px;">
                <p style="font-size: 13px; margin-bottom: 2px;"><strong>${escapeHtml(item.autor)}:</strong> ${escapeHtml(item.texto)}</p>
                <span class="carta-data">${item.data}</span>
            </div>
        `;
    });
}

function escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, m => map[m]);
}