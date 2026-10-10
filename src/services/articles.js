import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'

const articlesRef = collection(db, 'articles')

export async function createArticle({ title, category, imageUrl, content, author }) {
  return addDoc(articlesRef, {
    title,
    category,
    imageUrl,
    content,
    authorId: author.uid,
    authorName: author.displayName || author.email,
    views: 0,
    createdAt: serverTimestamp(),
  })
}

export async function getArticles() {
  const q = query(articlesRef, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function getArticle(id) {
  const snapshot = await getDoc(doc(db, 'articles', id))
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null
}