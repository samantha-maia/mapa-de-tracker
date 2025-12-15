# Autenticação

## Visão Geral

O sistema usa autenticação baseada em tokens (Bearer Token) para a maioria dos endpoints.

## Fluxo de Autenticação

### 1. Login

**Endpoint:** `POST /auth/login`

**Body:**
```json
{
  "email": "usuario@example.com",
  "password_hash": "hash_da_senha"
}
```

**Resposta:**
```json
{
  "authToken": "token_jwt_aqui",
  "message": "Login realizado com sucesso"
}
```

### 2. Uso do Token

Após obter o token, inclua-o no header de todas as requisições:

```
Authorization: Bearer {token}
```

### 3. Validação do Token

**Endpoint:** `GET /auth/me_app`

**Headers:**
```
Authorization: Bearer {token}
```

**Resposta:**
```json
{
  "result1": {
    "id": 1,
    "name": "Nome do Usuário",
    "email": "usuario@example.com",
    ...
  },
  "sprint_ativa": {...},
  "teams_leaders": [...]
}
```

## Integração com Aplicações

### Editor Web (React)

O token é passado via URL parameter:
```
/?fieldId=123&authToken=xyz...
```

### App Móvel (Flutter)

O token é armazenado localmente e incluído automaticamente nas requisições.

### Painel Web (Flutter Web)

O token é gerenciado pelo sistema de autenticação do FlutterFlow.

## Segurança

- Tokens têm tempo de expiração
- Tokens devem ser renovados periodicamente
- Nunca exponha tokens em logs ou código versionado
- Use HTTPS em produção

## Próximos Passos

- [Voltar para Endpoints Principais](./01-endpoints-principais.md)
- [Voltar para Documentação Principal](../README.md)

