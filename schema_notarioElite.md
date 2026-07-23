# Schema: notarioElite

## Table: examenes
| Column Name | Data Type | Max Length | Nullable |
|---|---|---|---|
| id | uuid | null | NO |
| titulo | text | null | NO |
| descripcion | text | null | YES |
| estado_ocr | character varying | 50 | YES |
| creado_por | uuid | null | YES |
| creado_en | timestamp with time zone | null | YES |
| pdf_url | text | null | YES |

## Table: usuario_nodos
| Column Name | Data Type | Max Length | Nullable |
|---|---|---|---|
| usuario_id | uuid | null | NO |
| nodo_id | character varying | 255 | NO |
| ley_id | integer | null | NO |
| nota | numeric | null | YES |
| completado | boolean | null | YES |
| actualizado_en | timestamp with time zone | null | YES |
| bloque_actual | integer | null | YES |

## Table: opciones
| Column Name | Data Type | Max Length | Nullable |
|---|---|---|---|
| id | uuid | null | NO |
| pregunta_id | uuid | null | YES |
| texto_opcion | text | null | NO |
| es_correcta | boolean | null | NO |
| orden | integer | null | YES |

## Table: usuario_leyes
| Column Name | Data Type | Max Length | Nullable |
|---|---|---|---|
| usuario_id | uuid | null | NO |
| ley_id | integer | null | NO |
| nota | numeric | null | YES |
| actualizado_en | timestamp with time zone | null | YES |

## Table: preguntas
| Column Name | Data Type | Max Length | Nullable |
|---|---|---|---|
| id | uuid | null | NO |
| ley_id | integer | null | YES |
| nodo_id | character varying | 100 | YES |
| texto_pregunta | text | null | NO |
| referencia_legal | text | null | YES |
| articulo | text | null | YES |
| explicacion | text | null | YES |
| nivel | character varying | 50 | YES |
| creado_en | timestamp with time zone | null | YES |
| examen_id | uuid | null | YES |
| orden | integer | null | YES |
| ban_mostrar | character | 1 | YES |

## Table: pregunta_articulos
| Column Name | Data Type | Max Length | Nullable |
|---|---|---|---|
| pregunta_id | uuid | null | NO |
| articulo_id | integer | null | NO |

## Table: usuario_preguntas
| Column Name | Data Type | Max Length | Nullable |
|---|---|---|---|
| usuario_id | uuid | null | NO |
| pregunta_id | uuid | null | NO |
| es_correcta | boolean | null | NO |
| respuesta_usuario | character varying | 5 | YES |
| creado_en | timestamp with time zone | null | YES |

## Table: glosario
| Column Name | Data Type | Max Length | Nullable |
|---|---|---|---|
| id | integer | null | NO |
| ley_id | integer | null | YES |
| termino | character varying | 255 | NO |
| definicion | text | null | NO |
| explicacion_adicional | text | null | YES |
| creado_en | timestamp with time zone | null | YES |

## Table: leyes
| Column Name | Data Type | Max Length | Nullable |
|---|---|---|---|
| id | integer | null | NO |
| nombre | text | null | NO |
| porcentaje | numeric | null | YES |
| ban_estudiar | boolean | null | YES |
| fecha_creacion | timestamp with time zone | null | YES |
| compendio_resumen | text | null | YES |
| informe_completo | text | null | YES |
| guia_didactica | text | null | YES |
| guia_estudio | text | null | YES |
| dictamen | text | null | YES |
| audio_1 | text | null | YES |
| audio_2 | text | null | YES |
| video_1 | text | null | YES |
| video_2 | text | null | YES |

## Table: invitaciones
| Column Name | Data Type | Max Length | Nullable |
|---|---|---|---|
| id | uuid | null | NO |
| usuario_id_que_invito | uuid | null | YES |
| nombre_invitado | character varying | 255 | NO |
| correo_invitado | character varying | 255 | NO |
| numero_whatsapp_invitado | character varying | 50 | YES |
| fecha_invitacion | timestamp with time zone | null | YES |
| token | character varying | 255 | NO |
| usada | boolean | null | YES |
| fecha_uso | timestamp with time zone | null | YES |

## Table: nodos
| Column Name | Data Type | Max Length | Nullable |
|---|---|---|---|
| id | character varying | 100 | NO |
| ley_id | integer | null | YES |
| padre_id | character varying | 100 | YES |
| nombre | text | null | NO |
| icono | character varying | 50 | YES |
| color | character varying | 20 | YES |
| nivel | integer | null | YES |
| concepto | text | null | YES |
| creado_en | timestamp with time zone | null | YES |
| analisis_jurisconsulto | text | null | YES |
| tips_didacticos | text | null | YES |
| total_preguntas | integer | null | YES |
| porcentaje_preguntas | numeric | null | YES |

## Table: usuarios
| Column Name | Data Type | Max Length | Nullable |
|---|---|---|---|
| id | uuid | null | NO |
| nombre | character varying | 255 | NO |
| correo | character varying | 255 | NO |
| clave | character varying | 255 | NO |
| fecha_pago | date | null | YES |
| fecha_vence | date | null | YES |
| ban_pago | character varying | 50 | YES |
| creado_en | timestamp with time zone | null | YES |
| actualizado_en | timestamp with time zone | null | YES |
| ultima_nota | numeric | null | YES |
| rol | character varying | 50 | YES |
| ban_fundador | boolean | null | YES |
| cantidad_invitaciones | integer | null | YES |
| ban_plan | character varying | 1 | YES |
| ban_cambiar_clave | boolean | null | YES |

## Table: log_invitaciones
| Column Name | Data Type | Max Length | Nullable |
|---|---|---|---|
| id | uuid | null | NO |
| usuario_id | uuid | null | YES |
| motivo | character varying | 255 | NO |
| cantidad | integer | null | NO |
| fecha | timestamp with time zone | null | YES |

## Table: articulos
| Column Name | Data Type | Max Length | Nullable |
|---|---|---|---|
| id | integer | null | NO |
| ley_id | integer | null | YES |
| nodo_id | character varying | 100 | YES |
| numero | character varying | 20 | YES |
| tema | text | null | YES |
| contenido | text | null | YES |
| resumen | text | null | YES |
| idea_clave | text | null | YES |
| palabras_clave | text | null | YES |
| errores_comunes | text | null | YES |
| truco_memoria | text | null | YES |
| nivel_importancia | character varying | 50 | YES |
| creado_en | timestamp with time zone | null | YES |

