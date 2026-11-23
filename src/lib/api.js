export async function api(url, options={}) {
  const response = await fetch(url, { credentials:'same-origin', headers:{'Content-Type':'application/json', ...(options.headers||{})}, ...options });
  const type=response.headers.get('content-type')||'';
  if(type.includes('application/json')) { const data=await response.json(); if(!response.ok) throw new Error(data.error||'Something went wrong'); return data; }
  if(!response.ok) throw new Error('Request failed'); return response;
}
