import React, { useState, useEffect } from 'react';

const LoginSencillo = ({ onLogin, onLogout }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Al cargar comprobamos si hay alguien en localStorage
    const savedUser = localStorage.getItem('usuarioPokemon');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      onLogin?.(parsedUser);
    }
  }, []);

  const manejarLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:4412/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('usuarioPokemon', JSON.stringify(data.user));
        setUser(data.user);
        onLogin?.(data.user);
        alert(`¡Bienvenido Entrenador ${data.user.nombre}!`);
      } else {
        alert(data.error || 'Credenciales incorrectas');
      }
    } catch (error) {
      alert('Error de conexión con la PokéDex Central.');
    }
  };

  const manejarLogout = () => {
    localStorage.removeItem('usuarioPokemon');
    setUser(null);
    onLogout?.();
  };

  if (user) {
    return (
      <div className="user-panel" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <div style={{ background: '#3b82f6', borderRadius: '50%', width:'40px', height:'40px', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:'bold'}}>
          {user.nombre.charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{fontWeight: 'bold', fontSize: '1.1rem'}}>{user.nombre}</div>
          <div style={{fontSize: '0.8rem', color: '#94a3b8'}}>{user.email}</div>
        </div>
        <button onClick={manejarLogout} className="btn-magico" style={{backgroundColor: '#ef4444', padding: '5px 15px'}}>Salir</button>
      </div>
    );
  }

  return (
    <form onSubmit={manejarLogin} className="login-card-inline">
      <input type="email" placeholder="Email (ej: ash@kanto.com)" onChange={(e)=>setEmail(e.target.value)} required />
      <input type="password" placeholder="Contraseña (1234)" onChange={(e)=>setPassword(e.target.value)} required />
      <button type="submit" className="btn-magico">Iniciar Sesión</button>
    </form>
  );
};

export default LoginSencillo;
