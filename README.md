# Clothing Manager — Backend

> Sistema web de gerenciamento interno para lojas de roupas.

---

## Objetivo do Sistema

O **Clothing Manager** tem como objetivo centralizar e digitalizar as operações internas de uma loja de roupas, eliminando o uso de controles manuais como cadernos e planilhas. O sistema permite que gerentes e funcionários gerenciem produtos, estoque, vendas e finanças em um único ambiente acessível via navegador.

---

## Descrição do Problema

Lojas de roupas de pequeno e médio porte frequentemente enfrentam dificuldades no controle de suas operações diárias: falta de visibilidade sobre o estoque real, ausência de histórico de vendas, dificuldade em apurar o resultado financeiro do período e falta de controle sobre as ações de cada funcionário. O Clothing Manager resolve esses problemas por meio de uma API RESTful que centraliza todas essas informações, com autenticação, controle de acesso por perfil e geração automática de registros financeiros e de estoque a cada venda realizada.

---

## Principais Funcionalidades

| Funcionalidade          | Descrição                                                          |
| ----------------------- | ------------------------------------------------------------------ |
| Autenticação JWT        | Login seguro com token de acesso, expiração em 8 horas            |
| Controle de acesso      | Perfis de gerente e funcionário com permissões distintas           |
| Gestão de produtos      | Cadastro, edição, busca por filtros e inativação sem perda de histórico |
| Controle de estoque     | Entradas, saídas, ajustes, perdas e alertas de estoque baixo       |
| Registro de vendas      | Múltiplos itens, formas de pagamento variadas e parcelamento        |
| Controle financeiro     | Entradas automáticas por venda e saídas manuais com resumo por período |
| Dashboard               | Visão geral do dia: vendas, estoque crítico e saldo financeiro     |
| Gestão de usuários      | Cadastro, edição e inativação de usuários com hash de senha        |

---

## Tecnologias Utilizadas

| Tecnologia       | Versão   | Finalidade                                  |
| ---------------- | -------- | ------------------------------------------- |
| Node.js          | v22+     | Ambiente de execução                        |
| NestJS           | v11      | Framework backend (arquitetura modular)     |
| TypeScript       | v5.7     | Tipagem estática e segurança em tempo de desenvolvimento |
| TypeORM          | v0.3     | ORM para mapeamento objeto-relacional       |
| PostgreSQL       | v16      | Banco de dados relacional                   |
| JWT / Passport   | —        | Autenticação stateless por token            |
| bcrypt           | v6       | Hash seguro de senhas                       |
| Swagger          | v11      | Documentação interativa da API              |
| Docker / Compose | —        | Containerização do banco de dados           |
| pnpm             | —        | Gerenciador de pacotes                      |
| Jest             | v30      | Testes unitários                            |

---

## Estrutura do Projeto

```
clothing Manager back/
├── src/
│   ├── auth/               # Autenticação JWT, guards e estratégias
│   │   ├── dto/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   ├── jwt.strategy.ts
│   │   ├── jwt-auth.guard.ts
│   │   ├── roles.decorator.ts
│   │   └── roles.guard.ts
│   ├── users/              # Gestão de usuários
│   │   ├── dto/
│   │   ├── user.entity.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── users.module.ts
│   ├── products/           # Gestão de produtos
│   │   ├── dto/
│   │   ├── product.entity.ts
│   │   ├── products.controller.ts
│   │   ├── products.service.ts
│   │   └── products.module.ts
│   ├── stock/              # Controle de estoque
│   │   ├── dto/
│   │   ├── stock-movement.entity.ts
│   │   ├── stock.controller.ts
│   │   ├── stock.service.ts
│   │   └── stock.module.ts
│   ├── sales/              # Registro de vendas
│   │   ├── dto/
│   │   ├── sale.entity.ts
│   │   ├── sale-item.entity.ts
│   │   ├── sales.controller.ts
│   │   ├── sales.service.ts
│   │   └── sales.module.ts
│   ├── finance/            # Controle financeiro
│   │   ├── dto/
│   │   ├── finance-entry.entity.ts
│   │   ├── finance.controller.ts
│   │   ├── finance.service.ts
│   │   └── finance.module.ts
│   ├── dashboard/          # Dashboard com visão geral
│   │   ├── dashboard.controller.ts
│   │   ├── dashboard.service.ts
│   │   └── dashboard.module.ts
│   ├── app.module.ts       # Módulo raiz da aplicação
│   └── main.ts             # Ponto de entrada da aplicação
├── test/                   # Testes end-to-end
├── docker-compose.yml      # Configuração do banco de dados
├── package.json
└── tsconfig.json
```

---

## Fluxo Básico de Funcionamento

```
Cliente (Frontend / Swagger)
        │
        ▼
  [POST /auth/login]
        │
        ▼
  JWT Token gerado
        │
        ▼
  Requisições autenticadas
  com Bearer Token no header
        │
        ├──▶ JwtAuthGuard valida o token
        │
        ├──▶ RolesGuard verifica o perfil (manager / employee)
        │
        ▼
  Controller (recebe e valida o DTO)
        │
        ▼
  Service (executa a regra de negócio)
        │
        ├── [Venda registrada] ──▶ StockService (baixa estoque automaticamente)
        │                    └──▶ FinanceService (gera entrada financeira)
        │
        ▼
  TypeORM ──▶ PostgreSQL
```

---

## Responsabilidades dos Principais Componentes

| Componente          | Responsabilidade                                                                 |
| ------------------- | -------------------------------------------------------------------------------- |
| `AuthModule`        | Emite e valida tokens JWT; define guards de autenticação e autorização por perfil |
| `UsersModule`       | Gerencia o ciclo de vida dos usuários, com hash de senha via bcrypt              |
| `ProductsModule`    | Mantém o catálogo de produtos com suporte a busca por múltiplos filtros          |
| `StockModule`       | Registra todas as movimentações de estoque e atualiza a quantidade dos produtos  |
| `SalesModule`       | Processa vendas com múltiplos itens, aciona o estoque e o financeiro automaticamente |
| `FinanceModule`     | Registra entradas e saídas financeiras; gera resumos por período                 |
| `DashboardModule`   | Consolida dados dos demais módulos para exibir o resumo operacional do dia       |

---

## Instruções de Execução

### Pré-requisitos

- [Node.js](https://nodejs.org/) v22+
- [pnpm](https://pnpm.io/) (`npm install -g pnpm`)
- [Docker](https://www.docker.com/) e Docker Compose

### 1. Clonar o repositório

```bash
git clone <url-do-repositorio>
cd "clothing Manager back"
```

### 2. Instalar as dependências

```bash
pnpm install
```

### 3. Configurar as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto com o seguinte conteúdo:

```env
DB_HOST=localhost
DB_PORT=5433
DB_USER=admin
DB_PASS=admin123
DB_NAME=clothing_manager
JWT_SECRET=sua_chave_secreta_aqui
```

### 4. Subir o banco de dados com Docker

```bash
docker compose up -d
```

### 5. Iniciar a aplicação

```bash
# Desenvolvimento (com hot reload)
pnpm run start:dev

# Produção
pnpm run build
pnpm run start:prod
```

A API estará disponível em: `http://localhost:3001/api/v1`

A documentação Swagger estará disponível em: `http://localhost:3001/api/docs`

### 6. Executar os testes

```bash
# Testes unitários
pnpm run test

# Cobertura de testes
pnpm run test:cov
```

---

## Backlog — Histórias de Usuário

### Autenticação e Controle de Acesso

| ID  | História de Usuário | Prioridade | Status |
| --- | ------------------- | ---------- | ------ |
| US01 | Como gerente, quero fazer login com e-mail e senha para acessar o sistema com segurança | Alta | ✅ Implementado |
| US02 | Como gerente, quero que funcionários tenham acesso limitado ao sistema para proteger informações sensíveis | Alta | ✅ Implementado |

### Gestão de Usuários

| ID  | História de Usuário | Prioridade | Status |
| --- | ------------------- | ---------- | ------ |
| US03 | Como gerente, quero cadastrar novos funcionários com nome, e-mail, senha e perfil | Alta | ✅ Implementado |
| US04 | Como gerente, quero editar os dados de um usuário para manter as informações atualizadas | Média | ✅ Implementado |
| US05 | Como gerente, quero inativar um usuário para remover seu acesso sem perder o histórico | Média | ✅ Implementado |

### Gestão de Produtos

| ID  | História de Usuário | Prioridade | Status |
| --- | ------------------- | ---------- | ------ |
| US06 | Como gerente, quero cadastrar produtos com nome, código, categoria, tamanho, cor e preços | Alta | ✅ Implementado |
| US07 | Como gerente ou funcionário, quero buscar produtos por nome, código, cor ou tamanho para localizá-los rapidamente | Alta | ✅ Implementado |
| US08 | Como gerente, quero editar as informações de um produto para corrigi-las ou atualizá-las | Média | ✅ Implementado |
| US09 | Como gerente, quero inativar um produto descontinuado sem apagar seu histórico de vendas | Média | ✅ Implementado |

### Controle de Estoque

| ID  | História de Usuário | Prioridade | Status |
| --- | ------------------- | ---------- | ------ |
| US10 | Como gerente, quero registrar entradas de mercadoria para manter o estoque atualizado | Alta | ✅ Implementado |
| US11 | Como gerente, quero registrar ajustes, perdas e saídas manuais com observação e responsável | Alta | ✅ Implementado |
| US12 | Como gerente ou funcionário, quero visualizar quais produtos estão com estoque baixo para planejar reposições | Alta | ✅ Implementado |
| US13 | Como gerente, quero ver o histórico completo de movimentações de estoque | Média | ✅ Implementado |

### Registro de Vendas

| ID  | História de Usuário | Prioridade | Status |
| --- | ------------------- | ---------- | ------ |
| US14 | Como funcionário, quero registrar uma venda com múltiplos produtos e forma de pagamento | Alta | ✅ Implementado |
| US15 | Como funcionário, quero registrar vendas parceladas informando o número de parcelas | Alta | ✅ Implementado |
| US16 | Como gerente, quero consultar o histórico de vendas filtrando por período | Alta | ✅ Implementado |
| US17 | Como gerente, quero ver o resumo de vendas do dia, incluindo o total por forma de pagamento | Alta | ✅ Implementado |

### Controle Financeiro

| ID  | História de Usuário | Prioridade | Status |
| --- | ------------------- | ---------- | ------ |
| US18 | Como gerente, quero que cada venda registrada gere automaticamente uma entrada financeira | Alta | ✅ Implementado |
| US19 | Como gerente, quero registrar saídas financeiras como pagamento de fornecedores e salários | Alta | ✅ Implementado |
| US20 | Como gerente, quero consultar o resumo financeiro do período com total de entradas, saídas e saldo | Alta | ✅ Implementado |

### Dashboard

| ID  | História de Usuário | Prioridade | Status |
| --- | ------------------- | ---------- | ------ |
| US21 | Como gerente ou funcionário, quero ver um resumo do dia ao abrir o sistema, com vendas, estoque e financeiro | Média | ✅ Implementado |

---

## Protótipo Navegável

> Link do protótipo: *(inserir link do Figma ou ferramenta utilizada)*

---

## Integrantes da Equipe

| Nome                  | Matrícula |
| --------------------- | --------- |
| Everson Alisson       | —         |
| Mateus Gomes          | —         |
| Tobias Figueiredo     | —         |

**Instituição:** Universidade Federal Rural do Semi-Árido (UFERSA)  
**Disciplina:** PEX0162 — Engenharia de Software  
**Professora:** Huliane Medeiros da Silva

---

## Status Atual do Desenvolvimento

O MVP está implementado com todos os módulos principais funcionais:

- [x] Autenticação JWT com controle de perfis (gerente / funcionário)
- [x] CRUD completo de usuários com hash de senha
- [x] CRUD completo de produtos com busca por filtros múltiplos
- [x] Controle de estoque com todos os tipos de movimentação
- [x] Registro de vendas com desconto automático de estoque e geração de entrada financeira
- [x] Controle financeiro com resumo por período
- [x] Dashboard com visão consolidada do dia
- [x] Documentação interativa via Swagger
- [x] Testes unitários nos principais módulos
