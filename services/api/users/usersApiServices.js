import { FKTND_H, JWT_TOKEN } from "@/services/tools/constants";

/** En-tête d'authentification (le cookie de session reste accepté côté serveur). */
const authHeader = () => {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem(JWT_TOKEN) : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
};

export const getClientUsers = async (setState) => {
  await fetch('/api/client/users/getUser', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      verskth: FKTND_H,
    })
  })
    .then((response) => response.json())
    .then((data) => setState(data))
    .catch((erro) => /*console.log('ERRR ==>', erro)*/() => {

    })
}
export const getAdminUsers = async (setState) => {
  await fetch('/api/admin/users/getUsers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      verskth: FKTND_H,
    })
  })
    .then((response) => response.json())
    .then((data) => setState(data))
    .catch((erro) => /*console.log('ERRR ==>', erro)*/() => {

    })
}

export const getClientUserById = async (id) => {
  let _data;
  await fetch('/api/client/user/' + id, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
    },
    body: JSON.stringify({
      verskth: FKTND_H,
    })
  })
    .then((response) => response.json())
    .then((data) => { _data = data })
    .catch((erro) => /*console.log('ERRR ==>', erro)*/() => {

    })

  return (_data)
}

export const getAdminUserById = async (id) => {
  let _data;
  await fetch('/api/users/' + id, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      verskth: FKTND_H,
    })
  })
    .then((response) => response.json())
    .then((data) => { _data = data })
    .catch((erro) => /*console.log('ERRR ==>', erro)*/() => {

    })

  return (_data)
}

export const getUserWithOperatorById = async (id) => {
  let _data;
  await fetch('/api/users/operator?id=' + id, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      verskth: FKTND_H,
    })
  })
    .then((response) => response.json())
    .then((data) => { _data = data })
    .catch((erro) => /*console.log('ERRR ==>', erro)*/() => {

    })

  return (_data)
}

export const getUserWithSupervisorById = async (id) => {
  let _data;
  await fetch('/api/users/supervisor?id=' + id, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      verskth: FKTND_H,
    })
  })
    .then((response) => response.json())
    .then((data) => { _data = data })
    .catch((erro) => /*console.log('ERRR ==>', erro)*/() => {

    })

  return (_data)
}

