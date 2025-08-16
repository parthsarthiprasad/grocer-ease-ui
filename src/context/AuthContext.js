import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(() => {
		try {
			const raw = localStorage.getItem('ge_auth');
			return raw ? JSON.parse(raw) : null;
		} catch (_) {
			return null;
		}
	});

	useEffect(() => {
		try {
			if (user) localStorage.setItem('ge_auth', JSON.stringify(user));
			else localStorage.removeItem('ge_auth');
		} catch (_) {}
	}, [user]);

	const login = (username, role = 'customer') => {
		setUser({ username, role });
	};

	const logout = () => {
		setUser(null);
	};

	const value = useMemo(() => ({ user, login, logout }), [user]);

	return (
		<AuthContext.Provider value={value}>{children}</AuthContext.Provider>
	);
};

export const useAuth = () => {
	return useContext(AuthContext);
};
