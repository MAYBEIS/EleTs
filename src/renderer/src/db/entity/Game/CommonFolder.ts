import { nanoid } from 'nanoid'

export default class CommonFolder {
  id: string
  name: string
  path: string
  game_id: string
  created_at: number

  constructor(name: string, path: string, game_id: string) {
    this.id = nanoid()
    this.name = name
    this.path = path
    this.game_id = game_id
    this.created_at = Date.now()
  }
}
