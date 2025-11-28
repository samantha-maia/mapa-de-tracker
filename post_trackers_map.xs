query "trackers-map" verb=POST {
  input {
    json json_map
    int projects_id? {
      table = "projects"
    }
  
    json map_texts?
    text name? filters=trim
  }

  stack {
    db.transaction {
      stack {
        var $section_quantity {
          value = $input.json_map.groups|count
        }
      
        db.add fields {
          data = {
            name            : $input.name
            section_quantity: $section_quantity
            created_at      : "now"
            updated_at      : "now"
            projects_id     : $input.projects_id
            map_texts       : $input.map_texts
          }
        } as $fields1
      
        foreach ($input.json_map.groups) {
          each as $sections {
            db.add sections {
              data = {
                section_number: $sections.section_number
                fields_id     : $fields1.id
                created_at    : "now"
                updated_at    : "now"
                x             : $sections.x
                y             : $sections.y
              }
            } as $sections1
          
            foreach ($sections.rows) {
              each as $rows {
                db.add rows {
                  data = {
                    row_number  : $rows.row_number
                    created_at  : "now"
                    updated_at  : "now"
                    sections_id : $sections1.id
                    x           : $rows.x
                    y           : $rows.y
                    groupOffsetX: $rows.groupOffsetX
                  }
                } as $rows1
              
                foreach ($rows.trackers) {
                  each as $tracker {
                    db.add rows_trackers {
                      data = {
                        position                 : $tracker.position
                        created_at               : "now"
                        updated_at               : "now"
                        rows_id                  : $rows1.id
                        trackers_id              : $tracker.ext.id
                        rows_trackers_statuses_id: 1
                        rowY                     : $tracker.rowY
                      }
                    } as $rows_trackers1
                  
                    db.query stakes {
                      where = $db.stakes.deleted_at == null && $db.stakes.trackers_id == $rows_trackers1.trackers_id
                      return = {type: "list"}
                    } as $stakes1
                  
                    foreach ($stakes1) {
                      each as $item2 {
                        db.add rows_stakes {
                          data = {
                            created_at        : "now"
                            updated_at        : null
                            rows_trackers_id  : $rows_trackers1.id
                            stakes_id         : $item2.id
                            stakes_statuses_id: 1
                            position          : $item2.position
                          }
                        } as $trackers_stakes1
                      }
                    }
                  }
                }
              }
            }
          }
        }
      
        // criacao das tarefas
        group {
          stack {
            db.query tasks_template {
              where = $db.tasks_template.is_fixed == true && $db.tasks_template.deleted_at == null
              return = {type: "list"}
            } as $tasks_template1
          
            foreach ($tasks_template1) {
              each as $tasks {
                db.get tasks_template {
                  field_name = "id"
                  field_value = $tasks.id
                } as $tasks1
              
                conditional {
                  if ($tasks1.equipaments_types_id == 1) {
                    db.query sections {
                      where = $db.sections.fields_id == $fields1.id && $db.sections.deleted_at == null
                      return = {type: "list"}
                    } as $task_sections
                  
                    foreach ($task_sections) {
                      each as $section_task {
                        db.query rows {
                          where = $db.rows.sections_id == $section_task.id && $db.rows.deleted_at == null
                          return = {type: "list"}
                        } as $task_rows
                      
                        foreach ($task_rows) {
                          each as $row_task {
                            db.query rows_trackers {
                              where = $db.rows_trackers.rows_id == $row_task.id && $db.rows_trackers.deleted_at == null
                              return = {type: "list"}
                            } as $task_rows_trackers
                          
                            foreach ($task_rows_trackers) {
                              each as $row_tracker_task {
                                db.add projects_backlogs {
                                  data = {
                                    created_at                   : "now"
                                    projects_id                  : $input.projects_id
                                    tasks_template_id            : $tasks.id
                                    projects_backlogs_statuses_id: 1
                                    fields_id                    : $fields1.id
                                    sections_id                  : $section_task.id
                                    rows_id                      : $row_task.id
                                    trackers_id                  : $row_tracker_task.trackers_id
                                    sprint_added                 : false
                                    rows_trackers_id             : $row_tracker_task.id
                                    description                  : $tasks1.description
                                    description_normalized       : $tasks1.description_normalized
                                    equipaments_types_id         : $tasks1.equipaments_types_id
                                    weight                       : $tasks1.weight
                                    unity_id                     : $tasks1.unity_id
                                    quantity                     : 0
                                  }
                                } as $projects_backlogs
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                
                  elseif ($tasks1.equipaments_types_id == 3) {
                    db.query sections {
                      where = $db.sections.fields_id == $fields1.id && $db.sections.deleted_at == null
                      return = {type: "list"}
                    } as $task_sections
                  
                    foreach ($task_sections) {
                      each as $section_task {
                        db.query rows {
                          where = $db.rows.sections_id == $section_task.id && $db.rows.deleted_at == null
                          return = {type: "list"}
                        } as $task_rows
                      
                        foreach ($task_rows) {
                          each as $row_task {
                            db.query rows_trackers {
                              where = $db.rows_trackers.rows_id == $row_task.id && $db.rows_trackers.deleted_at == null
                              return = {type: "list"}
                            } as $task_rows_trackers
                          
                            foreach ($task_rows_trackers) {
                              each as $row_tracker_task {
                                db.query rows_stakes {
                                  where = $db.rows_stakes.rows_trackers_id == $row_tracker_task.id && $db.rows_stakes.deleted_at == null
                                  return = {type: "list"}
                                } as $task_rows_stakes
                              
                                foreach ($task_rows_stakes) {
                                  each as $stake_task {
                                    db.add projects_backlogs {
                                      data = {
                                        created_at                   : "now"
                                        projects_id                  : $input.projects_id
                                        tasks_template_id            : $tasks.id
                                        projects_backlogs_statuses_id: 1
                                        fields_id                    : $fields1.id
                                        sections_id                  : $section_task.id
                                        rows_id                      : $row_task.id
                                        trackers_id                  : $row_tracker_task.trackers_id
                                        sprint_added                 : false
                                        rows_trackers_id             : $row_tracker_task.id
                                        rows_stakes_id               : $stake_task.id
                                        description                  : $tasks1.description
                                        description_normalized       : $tasks1.description_normalized
                                        equipaments_types_id         : $tasks1.equipaments_types_id
                                        weight                       : $tasks1.weight
                                        unity_id                     : $tasks1.unity_id
                                        quantity                     : 0
                                      }
                                    } as $projects_backlogs
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                
                  else {
                    db.query sections {
                      where = $db.sections.fields_id == $fields1.id && $db.sections.deleted_at == null
                      return = {type: "list"}
                    } as $task_sections
                  
                    foreach ($task_sections) {
                      each as $section_task {
                        db.query rows {
                          where = $db.rows.sections_id == $section_task.id && $db.rows.deleted_at == null
                          return = {type: "list"}
                        } as $task_rows
                      
                        foreach ($task_rows) {
                          each as $row_task {
                            db.add projects_backlogs {
                              data = {
                                created_at                   : "now"
                                projects_id                  : $input.projects_id
                                tasks_template_id            : $tasks.id
                                projects_backlogs_statuses_id: 1
                                fields_id                    : $fields1.id
                                sections_id                  : $section_task.id
                                rows_id                      : $row_task.id
                                sprint_added                 : false
                                description                  : $tasks1.description
                                description_normalized       : $tasks1.description_normalized
                                equipaments_types_id         : $tasks1.equipaments_types_id
                                weight                       : $tasks1.weight
                                unity_id                     : $tasks1.unity_id
                                quantity                     : 0
                              }
                            } as $projects_backlogs
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  response = $sections1
}