import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Get codex items for a specific user
export const getCodexItemsByUser = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('codex_items')
      .select('*')
      .eq('user_id', userId)
      .order('fecha', { ascending: false })

    if (error) {
      console.error('Error fetching codex items:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error in getCodexItemsByUser:', error)
    throw error
  }
}

// Get trending tweets
export const getTrendingTweets = async (limit = 50, categoria = null) => {
  try {
    let query = supabase
      .from('trending_tweets')
      .select('*')
      .order('fecha_captura', { ascending: false })
      .limit(limit)

    if (categoria) {
      query = query.eq('categoria', categoria)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching trending tweets:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error in getTrendingTweets:', error)
    throw error
  }
}

// Get tweet statistics by category
export const getTweetStatsByCategory = async () => {
  try {
    const { data, error } = await supabase
      .from('trending_tweets')
      .select('categoria')
      .not('categoria', 'is', null)

    if (error) {
      console.error('Error fetching tweet stats:', error)
      throw error
    }

    // Count tweets by category
    const stats = {}
    data?.forEach(tweet => {
      const cat = tweet.categoria || 'General'
      stats[cat] = (stats[cat] || 0) + 1
    })

    return stats
  } catch (error) {
    console.error('Error in getTweetStatsByCategory:', error)
    return {}
  }
}

// Get latest news
export const getLatestNews = async (limit = 20) => {
  try {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching latest news:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error in getLatestNews:', error)
    throw error
  }
}

// Get sondeos by user email
export const getSondeosByUser = async (userEmail) => {
  try {
    const { data, error } = await supabase
      .from('sondeos')
      .select('*')
      .eq('email_usuario', userEmail)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching sondeos:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error in getSondeosByUser:', error)
    throw error
  }
}

// Insert trend data
export const insertTrendData = async (trendData) => {
  try {
    const { data, error } = await supabase
      .from('trends')
      .insert([trendData])
      .select()

    if (error) {
      console.error('Error inserting trend data:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error in insertTrendData:', error)
    throw error
  }
}

// Get latest trend data
export const getLatestTrendData = async () => {
  try {
    const { data, error } = await supabase
      .from('trends')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      console.error('Error fetching latest trend data:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error in getLatestTrendData:', error)
    throw error
  }
}

// Get user projects
export const getUserProjects = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user projects:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error in getUserProjects:', error)
    throw error
  }
}

// Save codex item
export const saveCodexItem = async (codexItem) => {
  try {
    const { data, error } = await supabase
      .from('codex_items')
      .insert([codexItem])
      .select()
      .single()

    if (error) {
      console.error('Error saving codex item:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error in saveCodexItem:', error)
    throw error
  }
}

// Get available codex items
export const getAvailableCodexItems = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('codex_items')
      .select('*')
      .eq('user_id', userId)
      .is('project_id', null) // Items not assigned to any project
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching available codex items:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error in getAvailableCodexItems:', error)
    throw error
  }
}

// Get project assets (codex items assigned to a specific project)
export const getProjectAssets = async (projectId) => {
  try {
    const { data, error } = await supabase
      .from('codex_items')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching project assets:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error in getProjectAssets:', error)
    throw error
  }
}

// Assign codex item to project
export const assignCodexItemToProject = async (itemId, projectId) => {
  try {
    const { data, error } = await supabase
      .from('codex_items')
      .update({ project_id: projectId })
      .eq('id', itemId)
      .select()
      .single()

    if (error) {
      console.error('Error assigning codex item to project:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error in assignCodexItemToProject:', error)
    throw error
  }
}

// Create digitalstorage bucket if it doesn't exist (or verify it exists)
export const createCodexBucket = async () => {
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('Error listing buckets:', listError)
      return
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === 'digitalstorage')
    
    if (bucketExists) {
      console.log('digitalstorage bucket already exists')
    } else {
      console.warn('digitalstorage bucket not found. Please create it manually in Supabase dashboard.')
    }
  } catch (error) {
    console.error('Error checking digitalstorage bucket:', error)
  }
}

// ===================================================================
// PROJECT DECISIONS FUNCTIONS
// ===================================================================

// Create a new project decision
export const createProjectDecision = async (projectId, decisionData) => {
  try {
    const { data, error } = await supabase
      .from('project_decisions')
      .insert([{
        project_id: projectId,
        ...decisionData
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating project decision:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error in createProjectDecision:', error)
    throw error
  }
}

// Get all project decisions
export const getProjectDecisions = async (projectId) => {
  try {
    const { data, error } = await supabase
      .from('project_decisions')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching project decisions:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error in getProjectDecisions:', error)
    throw error
  }
}

// Update a project decision
export const updateProjectDecision = async (decisionId, updates) => {
  try {
    const { data, error } = await supabase
      .from('project_decisions')
      .update(updates)
      .eq('id', decisionId)
      .select()
      .single()

    if (error) {
      console.error('Error updating project decision:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error in updateProjectDecision:', error)
    throw error
  }
}

// Delete a project decision
export const deleteProjectDecision = async (decisionId) => {
  try {
    const { error } = await supabase
      .from('project_decisions')
      .delete()
      .eq('id', decisionId)

    if (error) {
      console.error('Error deleting project decision:', error)
      throw error
    }

    return true
  } catch (error) {
    console.error('Error in deleteProjectDecision:', error)
    throw error
  }
}

// Get child decisions
export const getChildDecisions = async (parentDecisionId) => {
  try {
    const { data, error } = await supabase
      .from('project_decisions')
      .select('*')
      .eq('parent_decision_id', parentDecisionId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching child decisions:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error in getChildDecisions:', error)
    throw error
  }
}

// Get root decisions (decisions without parent)
export const getRootDecisions = async (projectId) => {
  try {
    const { data, error } = await supabase
      .from('project_decisions')
      .select('*')
      .eq('project_id', projectId)
      .is('parent_decision_id', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching root decisions:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error in getRootDecisions:', error)
    throw error
  }
}

// Move decision as child of another decision
export const moveDecisionAsChild = async (decisionId, newParentId) => {
  try {
    const { data, error } = await supabase
      .from('project_decisions')
      .update({ parent_decision_id: newParentId })
      .eq('id', decisionId)
      .select()
      .single()

    if (error) {
      console.error('Error moving decision as child:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error in moveDecisionAsChild:', error)
    throw error
  }
}

// Promote decision to root (remove parent)
export const promoteDecisionToRoot = async (decisionId) => {
  try {
    const { data, error } = await supabase
      .from('project_decisions')
      .update({ parent_decision_id: null })
      .eq('id', decisionId)
      .select()
      .single()

    if (error) {
      console.error('Error promoting decision to root:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error in promoteDecisionToRoot:', error)
    throw error
  }
}

// Get project statistics
export const getProjectStats = async (projectId) => {
  try {
    const { data, error } = await supabase
      .from('project_decisions')
      .select('decision_type, urgency')
      .eq('project_id', projectId)

    if (error) {
      console.error('Error fetching project stats:', error)
      throw error
    }

    // Calculate statistics
    const stats = {
      total: data?.length || 0,
      by_type: {},
      by_urgency: {}
    }

    data?.forEach(decision => {
      // Count by type
      const type = decision.decision_type || 'enfoque'
      stats.by_type[type] = (stats.by_type[type] || 0) + 1

      // Count by urgency
      const urgency = decision.urgency || 'medium'
      stats.by_urgency[urgency] = (stats.by_urgency[urgency] || 0) + 1
    })

    return stats
  } catch (error) {
    console.error('Error in getProjectStats:', error)
    return { total: 0, by_type: {}, by_urgency: {} }
  }
} 