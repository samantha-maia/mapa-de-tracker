query update_inspection verb=POST {
  auth = "users"

  input {
    int sprints_tasks_id? {
      table = "sprints_tasks"
    }
  
    int quality_status_id? {
      table = "quality_status"
    }
  }

  stack {
    var $today {
      value = now
        |format_timestamp:"Y-m-d":"America/Sao_Paulo"
    }
  
    db.get sprints_tasks {
      field_name = "id"
      field_value = $input.sprints_tasks_id
    } as $sprints_tasks2
  
    // tarefa de inspecao
    // 
    db.get projects_backlogs {
      field_name = "id"
      field_value = $sprints_tasks2.projects_backlogs_id
    } as $projects_backlogs1
  
    precondition ($projects_backlogs1.is_inspection) {
      error = "Essa tarefa n\303\243o \303\251 uma inspe\303\247\303\243o"
    }
  
    // editando a tarefa de inspeção
    db.edit sprints_tasks {
      field_name = "id"
      field_value = $input.sprints_tasks_id
      data = {sprints_tasks_statuses_id: 3, executed_at: $today}
    } as $sprints_tasks1
  
    // é task
    conditional {
      if ($projects_backlogs1.subtasks_id == null) {
        db.edit projects_backlogs {
          field_name = "id"
          field_value = $projects_backlogs1.id
          data = {projects_backlogs_statuses_id: 3}
        } as $projects_backlogs2
      
        // editar tarefa inspecionada
        db.edit projects_backlogs {
          field_name = "id"
          field_value = $projects_backlogs2.projects_backlogs_id
          data = {quality_status_id: $input.quality_status_id}
        } as $projects_backlogs3
      
        // lógica para estaca individual (equipaments_types_id == 3)
        conditional {
          if ($projects_backlogs3.equipaments_types_id == 3) {
            conditional {
              if ($input.quality_status_id == 2) {
                // inspeção aprovada - estaca aprovada
                db.edit rows_stakes {
                  field_name = "id"
                  field_value = $projects_backlogs3.rows_stakes_id
                  data = {stakes_statuses_id: 2}
                } as $rows_stakes1
              }
            }
            
            conditional {
              if ($input.quality_status_id == 3) {
                // inspeção reprovada - estaca reprovada
                db.edit rows_stakes {
                  field_name = "id"
                  field_value = $projects_backlogs3.rows_stakes_id
                  data = {stakes_statuses_id: 7}
                } as $rows_stakes_rejected
              }
            }
          }
        }
      
        // lógica para tracker (rows_trackers_id existe e não é estaca individual)
        conditional {
          if ($projects_backlogs3.rows_trackers_id && $projects_backlogs3.rows_stakes_id == null) {
            // inspeção aprovada
            conditional {
              if ($input.quality_status_id == 2) {
                db.query rows_stakes {
                  where = $db.rows_stakes.rows_trackers_id == $projects_backlogs3.rows_trackers_id && $db.rows_stakes.deleted_at == null
                  return = {type: "list"}
                } as $tracker_stakes_list
              
                conditional {
                  if ($tracker_stakes_list == null) {
                    var $tracker_stakes_list {
                      value = []
                    }
                  }
                }
              
                var $all_stakes_blue {
                  value = true
                }
              
                foreach ($tracker_stakes_list) {
                  each as $tracker_stake_record {
                    conditional {
                      if ($tracker_stake_record.stakes_statuses_id != 2) {
                        var $all_stakes_blue {
                          value = false
                        }
                      }
                    }
                  }
                }
              
                conditional {
                  if ($all_stakes_blue && (($tracker_stakes_list|count) > 0)) {
                    db.edit rows_trackers {
                      field_name = "id"
                      field_value = $projects_backlogs3.rows_trackers_id
                      data = {rows_trackers_statuses_id: 5, updated_at: now}
                    } as $rows_trackers_updated_to_green
                  
                    foreach ($tracker_stakes_list) {
                      each as $stake_to_green {
                        db.edit rows_stakes {
                          field_name = "id"
                          field_value = $stake_to_green.id
                          data = {stakes_statuses_id: 5}
                        } as $rows_stakes_updated_to_green
                      }
                    }
                  }
                }
              }
            }
            
            // inspeção reprovada
            conditional {
              if ($input.quality_status_id == 3) {
                // atualizar apenas o tracker para inspeção reprovada (não altera status das estacas)
                db.edit rows_trackers {
                  field_name = "id"
                  field_value = $projects_backlogs3.rows_trackers_id
                  data = {rows_trackers_statuses_id: 8, updated_at: now}
                } as $rows_trackers_rejected
              }
            }
          }
        }
      }
    }
  
    // é subtask
    conditional {
      if ($projects_backlogs1.subtasks_id != null) {
        db.get subtasks {
          field_name = "id"
          field_value = $projects_backlogs1.subtasks_id
          addon = [
            {
              name  : "projects_backlogs"
              output: ["id", "quantity"]
              input : {projects_backlogs_id: $output.projects_backlogs_id}
              as    : "_projects_backlogs"
            }
          ]
        } as $subtasks1
      
        db.edit subtasks {
          field_name = "id"
          field_value = $subtasks1.id
          data = {quantity_done: $subtasks1.quantity}
        } as $subtasks2
      }
    }
  }

  response = $sprints_tasks1
}