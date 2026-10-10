import {
  collection,
  addDoc,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'
import { db } from './firebase'

// ---------- Likes and dislikes ----------

export async function getReactions(articleId, uid) {
  const snap = await getDocs(collection(db, 'articles', articleId, 'reactions'))
  let likes = 0
  let dislikes = 0
  let myReaction = null

  snap.docs.forEach((d) => {
    const type = d.data().type
    if (type === 'like') likes++
    if (type === 'dislike') dislikes++
    if (uid && d.id === uid) myReaction = type
  })

  return { likes, dislikes, myReaction }
}

// Clicking the same button again removes the vote. Clicking the other one switches it.
export async function setReaction(articleId, uid, type, currentReaction) {
  const ref = doc(db, 'articles', articleId, 'reactions', uid)

  if (currentReaction === type) {
    await deleteDoc(ref)
  } else {
    await setDoc(ref, { type, createdAt: serverTimestamp() })
  }
}

// ---------- Comments ----------

export async function getComments(articleId) {
  const q = query(
    collection(db, 'articles', articleId, 'comments'),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function addComment(articleId, user, text) {
  return addDoc(collection(db, 'articles', articleId, 'comments'), {
    text,
    authorId: user.uid,
    authorName: user.displayName || user.email,
    createdAt: serverTimestamp(),
  })
}

export async function deleteComment(articleId, commentId) {
  await deleteDoc(doc(db, 'articles', articleId, 'comments', commentId))
}

// ---------- Delete an article together with its comments and reactions ----------

async function deleteAllIn(refs) {
  let batch = writeBatch(db)
  let count = 0

  for (const ref of refs) {
    batch.delete(ref)
    count++
    if (count === 400) {
      await batch.commit()
      batch = writeBatch(db)
      count = 0
    }
  }
  if (count > 0) await batch.commit()
}

export async function deleteArticleCompletely(articleId) {
  const comments = await getDocs(collection(db, 'articles', articleId, 'comments'))
  const reactions = await getDocs(collection(db, 'articles', articleId, 'reactions'))

  await deleteAllIn(comments.docs.map((d) => d.ref))
  await deleteAllIn(reactions.docs.map((d) => d.ref))
  await deleteDoc(doc(db, 'articles', articleId))
}