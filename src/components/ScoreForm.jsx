import { useState } from "react"


import { supabase } from "../api/supabase"
export default function ScoreForm({ user }) {
  const [score, setScore] = useState("")

  async function addScore(user, newScore) {
    const { data: scores } = await supabase
      .from('scores')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (scores.length >= 5) {
      await supabase
        .from('scores')
        .delete()
        .eq('id', scores[0].id)
    }

    await supabase.from('scores').insert([
      {
        user_id: user.id,
        score: newScore
      }
    ])
  }

  const handleSubmit = async () => {
    await addScore(user, Number(score))
    alert("Score added!")
  }

  return (
    <div>
      <input
        type="number"
        value={score}
        onChange={(e) => setScore(e.target.value)}
        placeholder="Enter score"
      />

      <button onClick={handleSubmit}>
        Add Score
      </button>
    </div>
  )
}