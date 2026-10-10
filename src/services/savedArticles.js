import {
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  collection,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import { getArticle } from './articles'

const savedDoc = (uid, articleId) =>
  doc(db, 'users', uid, 'savedArticles', articleId)

export async function saveArticle(uid, articleId) {
  await setDoc(savedDoc(uid, articleId), {
    articleId,
    savedAt: serverTimestamp(),
  })
}

export async function unsaveArticle(uid, articleId) {
  await deleteDoc(savedDoc(uid, articleId))
}

export async function isArticleSaved(uid, articleId) {
  const snapshot = await getDoc(savedDoc(uid, articleId))
  return snapshot.exists()
}

export async function getSavedArticles(uid) {
  const q = query(
    collection(db, 'users', uid, 'savedArticles'),
    orderBy('savedAt', 'desc')
  )
  const snapshot = await getDocs(q)
  const articles = await Promise.all(
    snapshot.docs.map((d) => getArticle(d.data().articleId))
  )
  return articles.filter(Boolean)
}