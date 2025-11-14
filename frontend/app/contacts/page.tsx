'use client';

import { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';

type Contact = {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  photo?: string | null;
  createdAt: string;
};

const PAGE_LIMIT = 10;

export default function ContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  // Create form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Edit mode state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // Search / sort / pagination
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Auth check + role + load contacts
  useEffect(() => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('accessToken')
        : null;
    const storedRole =
      typeof window !== 'undefined'
        ? localStorage.getItem('userRole')
        : null;

    if (!token) {
      router.push('/login');
      return;
    }

    if (storedRole && storedRole !== role) setRole(storedRole);

    const fetchContacts = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await api.get('/contacts', {
          params: {
            page,
            limit: PAGE_LIMIT,
            search: search || undefined,
            sortBy,
            sortOrder,
            all: storedRole === 'admin' ? true : undefined,
          },
        });

        const data = Array.isArray(res.data.data)
          ? res.data.data
          : Array.isArray(res.data)
          ? res.data
          : [];

        setContacts(data);
        setHasMore(data.length === PAGE_LIMIT);
      } catch (err: any) {
        console.error(err);
        setError(
          err?.response?.data?.message ||
            'An error occurred while loading contacts.',
        );
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, [router, page, search, sortBy, sortOrder, role]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setPhotoFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
    } else {
      setPhotoPreview(null);
    }
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append('name', name);
      if (email) formData.append('email', email);
      if (phone) formData.append('phone', phone);
      if (photoFile) formData.append('photo', photoFile);

      const res = await api.post('/contacts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const created: Contact = res.data;
      if (page === 1) setContacts((prev) => [created, ...prev]);

      setName('');
      setEmail('');
      setPhone('');
      setPhotoFile(null);
      setPhotoPreview(null);
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          'An error occurred while creating the contact.',
      );
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (c: Contact) => {
    setEditingId(c.id);
    setEditName(c.name);
    setEditEmail(c.email ?? '');
    setEditPhone(c.phone ?? '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditEmail('');
    setEditPhone('');
  };

  const handleEditSave = async (id: number) => {
    setEditSaving(true);
    try {
      const payload = { name: editName, email: editEmail, phone: editPhone };
      const res = await api.patch(`/contacts/${id}`, payload);
      const updated: Contact = res.data;

      setContacts((prev) => prev.map((c) => (c.id === id ? updated : c)));
      cancelEdit();
    } catch (err: any) {
      console.error(err);
      alert(
        err?.response?.data?.message ||
          'An error occurred while updating the contact.',
      );
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    try {
      await api.delete(`/contacts/${id}`);
      setContacts((prev) => prev.filter((c) => c.id !== id));
      if (editingId === id) cancelEdit();
    } catch (err: any) {
      console.error(err);
      alert(
        err?.response?.data?.message ||
          'An error occurred while deleting the contact.',
      );
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userRole');
    router.push('/login');
  };

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
  };

  const handleSearchChange = (v: string) => {
    setSearch(v);
    setPage(1);
  };
  const handleSortByChange = (v: 'name' | 'createdAt') => {
    setSortBy(v);
    setPage(1);
  };
  const handleSortOrderChange = (v: 'ASC' | 'DESC') => {
    setSortOrder(v);
    setPage(1);
  };

  const goPrevPage = () => {
    if (page > 1) setPage((p) => p - 1);
  };
  const goNextPage = () => {
    if (hasMore) setPage((p) => p + 1);
  };

  // ------------------- JSX (Tailwind) -------------------
  return (
    <div className="min-h-screen px-4 py-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        {/* Header */}
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">My Contacts</h1>
            {role && (
              <p className="mt-1 text-sm text-slate-500">
                Logged in as <span className="font-semibold">{role}</span>
              </p>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center justify-center rounded-full bg-slate-800 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-900"
          >
            Logout
          </button>
        </header>

        {/* Search & Sort */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
          >
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Search (name / email)
              </label>
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) =>
                    handleSortByChange(e.target.value as 'name' | 'createdAt')
                  }
                  className="rounded-lg border border-slate-300 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="createdAt">Created At</option>
                  <option value="name">Name</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Order
                </label>
                <select
                  value={sortOrder}
                  onChange={(e) =>
                    handleSortOrderChange(e.target.value as 'ASC' | 'DESC')
                  }
                  className="rounded-lg border border-slate-300 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="DESC">DESC</option>
                  <option value="ASC">ASC</option>
                </select>
              </div>

              <button
                type="submit"
                className="h-9 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
              >
                Apply
              </button>
            </div>
          </form>
        </section>

        {/* Add New Contact */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">
            Add New Contact
          </h2>

          <form onSubmit={handleCreate} className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600">
                Name
              </label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600">
                Phone
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600">
                Photo
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="mt-1 text-sm"
              />
              {photoFile && (
                <p className="mt-1 text-xs text-slate-500">
                  Selected: {photoFile.name}
                </p>
              )}
            </div>

            {photoPreview && (
              <div className="sm:col-span-2">
                <p className="mb-1 text-xs text-slate-500">Preview:</p>
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="h-20 w-20 rounded-lg border border-slate-200 object-cover"
                />
              </div>
            )}

            {error && (
              <p className="sm:col-span-2 text-sm text-red-600">{error}</p>
            )}

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-lg bg-blue-600  px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Add Contact'}
              </button>
            </div>
          </form>
        </section>

        {/* Contact List */}
        <section className="space-y-3">
          {loading ? (
            <p className="text-sm text-slate-500">Loading contacts...</p>
          ) : contacts.length === 0 ? (
            <p className="text-sm text-slate-500">
              No contacts have been added yet.
            </p>
          ) : (
            <>
              <div className="grid gap-3 md:grid-cols-2">
                {contacts.map((c) => {
                  const photoUrl = c.photo
                    ? `http://localhost:3000/uploads/contacts/${c.photo}`
                    : null;
                  const isEditing = editingId === c.id;

                  return (
                    <div
                      key={c.id}
                      className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="mt-1">
                        {photoUrl ? (
                          <img
                            src={photoUrl}
                            alt={c.name}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-400">
                            No<br />photo
                          </div>
                        )}
                      </div>

                      <div className="flex flex-1 flex-col gap-1">
                        {/* Name */}
                        {isEditing ? (
                          <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        ) : (
                          <div className="text-sm font-semibold text-slate-900">
                            {c.name}
                          </div>
                        )}

                        {/* Email */}
                        {isEditing ? (
                          <input
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        ) : (
                          <div className="text-xs text-slate-600">
                            {c.email || <span className="italic">No email</span>}
                          </div>
                        )}

                        {/* Phone */}
                        {isEditing ? (
                          <input
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        ) : (
                          <div className="text-xs text-slate-600">
                            {c.phone || <span className="italic">No phone</span>}
                          </div>
                        )}

                        <div className="mt-1 text-[11px] text-slate-400">
                          {new Date(c.createdAt).toLocaleString()}
                        </div>

                        {/* Actions */}
                        <div className="mt-2 flex flex-wrap gap-2">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => handleEditSave(c.id)}
                                disabled={editSaving}
                                className="inline-flex items-center rounded-full bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                              >
                                {editSaving ? 'Saving…' : 'Save'}
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="inline-flex items-center rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEdit(c)}
                                className="inline-flex items-center rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(c.id)}
                                className="inline-flex items-center rounded-full bg-rose-600 px-3 py-1 text-xs font-medium text-white hover:bg-rose-700"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={goPrevPage}
                  disabled={page === 1 || loading}
                  className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  Prev
                </button>
                <span className="text-xs text-slate-500">
                  Page {page}
                </span>
                <button
                  onClick={goNextPage}
                  disabled={!hasMore || loading}
                  className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
