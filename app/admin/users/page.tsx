"use client";

import { useState, useEffect } from "react";
import HssNavbar from "@/components/layout/HssNavbar";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/lib/supabase";

interface UserData {
  id: string;
  username: string;
  role: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase.from("users").select("id, username, role");
        if (error) throw error;
        setUsers((data as UserData[]) || []);
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  return (
    <>
      <HssNavbar activePage="dashboard" />
      <main className="flex-fill mt-5 pt-5">
        <div className="container py-5">
          <h2 className="text-center fw-bold mb-4">Manage Users</h2>
          <div className="bg-white p-4 shadow rounded">
            {loading ? (
              <p className="text-center">Loading...</p>
            ) : (
              <table className="table table-bordered table-striped">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Document ID</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr><td colSpan={3} className="text-center text-muted">No users found.</td></tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id}>
                        <td>{u.username}</td>
                        <td><span className="badge bg-primary">{u.role}</span></td>
                        <td><code>{u.id}</code></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
