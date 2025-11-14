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

const PAGE_LIMIT = 10; // 10 items per page

export default function ContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state for creating a new contact
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // Search + sort state
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  // Pagination state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Login check + load contacts
  useEffect(() => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('accessToken')
        : null;

    if (!token) {
      router.push('/login');
      return;
    }

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
          },
        });

        let list: Contact[] = [];
        let total = 0;

        // When backend returns { data: [...], total, page, limit }
        if (Array.isArray(res.data.data)) {
          list = res.data.data;
          total =
            typeof res.data.total === 'number'
              ? res.data.total
              : res.data.data.length;
        }
        // When backend returns just an array
        else if (Array.isArray(res.data)) {
          list = res.data;
          total = res.data.length;
        }

        setContacts(list);

        // Determine if there is a next page based on total count
        setHasMore(total > page * PAGE_LIMIT);
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
  }, [router, page, search, sortBy, sortOrder]);

  // File selection + preview
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

  // Create a new contact
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
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const created: Contact = res.data;

      // If current page is 1, immediately prepend the new contact
      if (page === 1) {
        setContacts((prev) => [created, ...prev]);
      }

      // Reset form
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

  // Start editing
  const startEdit = (c: Contact) => {
    setEditingId(c.id);
    setEditName(c.name);
    setEditEmail(c.email ?? '');
    setEditPhone(c.phone ?? '');
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditEmail('');
    setEditPhone('');
  };

  // Save edited contact
  const handleEditSave = async (id: number) => {
    setEditSaving(true);
    try {
      const payload = {
        name: editName,
        email: editEmail,
        phone: editPhone,
      };

      const res = await api.patch(`/contacts/${id}`, payload);
      const updated: Contact = res.data;

      setContacts((prev) =>
        prev.map((c) => (c.id === id ? updated : c)),
      );
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

  // Delete contact
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;

    try {
      await api.delete(`/contacts/${id}`);
      setContacts((prev) => prev.filter((c) => c.id !== id));
      if (editingId === id) {
        cancelEdit();
      }
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
    router.push('/login');
  };

  // Search form submit (for Enter key)
  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
  };

  // When search text changes, reset to page 1
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleSortByChange = (value: 'name' | 'createdAt') => {
    setSortBy(value);
    setPage(1);
  };

  const handleSortOrderChange = (value: 'ASC' | 'DESC') => {
    setSortOrder(value);
    setPage(1);
  };

  // Page navigation
  const goPrevPage = () => {
    if (page > 1) setPage((p) => p - 1);
  };

  const goNextPage = () => {
    if (hasMore) setPage((p) => p + 1);
  };

  return (
    <div style={{ padding: 20 }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <h1>My Contacts</h1>
        <button onClick={handleLogout}>Logout</button>
      </header>

      {/* Search + Sort */}
      <section
        style={{
          marginBottom: 16,
          padding: 12,
          border: '1px solid #ddd',
          borderRadius: 8,
          maxWidth: 800,
        }}
      >
        <form
          onSubmit={handleSearchSubmit}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            alignItems: 'center',
          }}
        >
          {/* Search */}
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ fontSize: 12, color: '#555' }}>
              Search (name / email)
            </label>
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          {/* Sort By */}
          <div>
            <label style={{ fontSize: 12, color: '#555' }}>Sort By</label>
            <select
              value={sortBy}
              onChange={(e) =>
                handleSortByChange(e.target.value as 'name' | 'createdAt')
              }
            >
              <option value="createdAt">Created At</option>
              <option value="name">Name</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label style={{ fontSize: 12, color: '#555' }}>Order</label>
            <select
              value={sortOrder}
              onChange={(e) =>
                handleSortOrderChange(e.target.value as 'ASC' | 'DESC')
              }
            >
              <option value="DESC">DESC</option>
              <option value="ASC">ASC</option>
            </select>
          </div>

          <div>
            <button type="submit">Apply</button>
          </div>
        </form>
      </section>

      {/* Add New Contact Form */}
      <section
        style={{
          marginBottom: 24,
          padding: 16,
          border: '1px solid #ccc',
          borderRadius: 8,
          maxWidth: 500,
        }}
      >
        <h2 style={{ marginBottom: 12 }}>Add New Contact</h2>

        <form onSubmit={handleCreate}>
          <div style={{ marginBottom: 8 }}>
            <label>
              Name{' '}
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
          </div>

          <div style={{ marginBottom: 8 }}>
            <label>
              Email{' '}
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
          </div>

          <div style={{ marginBottom: 8 }}>
            <label>
              Phone{' '}
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </label>
          </div>

          <div style={{ marginBottom: 8 }}>
            <label>
              Photo{' '}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
            </label>
            {photoFile && (
              <div style={{ fontSize: 12, color: '#555' }}>
                Selected: {photoFile.name}
              </div>
            )}
          </div>

          {/* Preview */}
          {photoPreview && (
            <div style={{ marginBottom: 8 }}>
              <p style={{ fontSize: 12, color: '#555' }}>Preview:</p>
              <img
                src={photoPreview}
                alt="Preview"
                style={{
                  width: 80,
                  height: 80,
                  objectFit: 'cover',
                  borderRadius: 8,
                  border: '1px solid #ccc',
                }}
              />
            </div>
          )}

          {error && (
            <p style={{ color: 'red', marginBottom: 8 }}>{error}</p>
          )}

          <button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Add Contact'}
          </button>
        </form>
      </section>

      {/* Contact List */}
      <section>
        {loading ? (
          <p>Loading contacts...</p>
        ) : contacts.length === 0 ? (
          <p>No contacts have been added yet.</p>
        ) : (
          <>
            <table
              style={{
                borderCollapse: 'collapse',
                width: '100%',
                maxWidth: 800,
              }}
            >
              <thead>
                <tr>
                  <th style={{ borderBottom: '1px solid #ccc', padding: 8 }}>
                    Photo
                  </th>
                  <th style={{ borderBottom: '1px solid #ccc', padding: 8 }}>
                    Name
                  </th>
                  <th style={{ borderBottom: '1px solid #ccc', padding: 8 }}>
                    Email
                  </th>
                  <th style={{ borderBottom: '1px solid #ccc', padding: 8 }}>
                    Phone
                  </th>
                  <th style={{ borderBottom: '1px solid #ccc', padding: 8 }}>
                    Created At
                  </th>
                  <th style={{ borderBottom: '1px solid #ccc', padding: 8 }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((c) => {
                  const photoUrl = c.photo
                    ? `http://localhost:3000/uploads/contacts/${c.photo}`
                    : null;

                  const isEditing = editingId === c.id;

                  return (
                    <tr key={c.id}>
                      {/* Photo */}
                      <td
                        style={{
                          borderBottom: '1px solid #eee',
                          padding: 8,
                        }}
                      >
                        {photoUrl ? (
                          <img
                            src={photoUrl}
                            alt={c.name}
                            style={{
                              width: 40,
                              height: 40,
                              objectFit: 'cover',
                              borderRadius: 50,
                            }}
                          />
                        ) : (
                          <span
                            style={{
                              fontSize: 12,
                              color: '#999',
                            }}
                          >
                            No photo
                          </span>
                        )}
                      </td>

                      {/* Name */}
                      <td
                        style={{
                          borderBottom: '1px solid #eee',
                          padding: 8,
                        }}
                      >
                        {isEditing ? (
                          <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                          />
                        ) : (
                          c.name
                        )}
                      </td>

                      {/* Email */}
                      <td
                        style={{
                          borderBottom: '1px solid #eee',
                          padding: 8,
                        }}
                      >
                        {isEditing ? (
                          <input
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                          />
                        ) : (
                          c.email
                        )}
                      </td>

                      {/* Phone */}
                      <td
                        style={{
                          borderBottom: '1px solid #eee',
                          padding: 8,
                        }}
                      >
                        {isEditing ? (
                          <input
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                          />
                        ) : (
                          c.phone
                        )}
                      </td>

                      {/* Created At */}
                      <td
                        style={{
                          borderBottom: '1px solid #eee',
                          padding: 8,
                        }}
                      >
                        {new Date(c.createdAt).toLocaleString()}
                      </td>

                      {/* Actions */}
                      <td
                        style={{
                          borderBottom: '1px solid #eee',
                          padding: 8,
                        }}
                      >
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => handleEditSave(c.id)}
                              disabled={editSaving}
                              style={{ marginRight: 8 }}
                            >
                              {editSaving ? 'Saving...' : 'Save'}
                            </button>
                            <button onClick={cancelEdit}>Cancel</button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(c)}
                              style={{ marginRight: 8 }}
                            >
                              Edit
                            </button>
                            <button onClick={() => handleDelete(c.id)}>
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            <div
              style={{
                marginTop: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <button onClick={goPrevPage} disabled={page === 1 || loading}>
                Prev
              </button>
              <span>Page {page}</span>
              <button onClick={goNextPage} disabled={!hasMore || loading}>
                Next
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
