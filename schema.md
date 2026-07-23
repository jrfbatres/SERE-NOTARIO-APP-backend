# Schema: asistente_legal_app

## Table: CON_Pais
| Column Name | Data Type | Max Length | Nullable |
|---|---|---|---|
| nombre | text | null | NO |
| id_pais | text | null | NO |

## Table: CON_TIPO_BIEN
| Column Name | Data Type | Max Length | Nullable |
|---|---|---|---|
| id_tipo_bien | integer | null | NO |
| id_pais | text | null | YES |
| nombre_tipo_bien | text | null | NO |
| ban_escritura_publica | character varying | 1 | YES |

## Table: CON_Departamento
| Column Name | Data Type | Max Length | Nullable |
|---|---|---|---|
| id_departamento | integer | null | NO |
| nombre | text | null | NO |
| id_pais | text | null | NO |

## Table: CON_Distrito
| Column Name | Data Type | Max Length | Nullable |
|---|---|---|---|
| id_distrito | integer | null | NO |
| nombre | text | null | NO |
| id_departamento | integer | null | NO |

## Table: CON_Municipio
| Column Name | Data Type | Max Length | Nullable |
|---|---|---|---|
| id_municipio | integer | null | NO |
| nombre | text | null | NO |
| id_distrito | integer | null | NO |

## Table: CON_ROLES
| Column Name | Data Type | Max Length | Nullable |
|---|---|---|---|
| id_rol | integer | null | NO |
| id_pais | text | null | YES |
| nombre_rol | text | null | NO |
| id_rol_par | integer | null | YES |
| ban_tipo_rol | character varying | 1 | YES |

## Table: CON_CATEGORIA_DOCUMENTOS
| Column Name | Data Type | Max Length | Nullable |
|---|---|---|---|
| id_categoria | integer | null | NO |
| id_pais | text | null | YES |
| nombre_categoria | text | null | NO |
| ban_escritura | character varying | 1 | YES |

## Table: CON_TIPO_DOCUMENTOS
| Column Name | Data Type | Max Length | Nullable |
|---|---|---|---|
| id_tipo_documento | integer | null | NO |
| id_categoria | integer | null | NO |
| nombre_tipo | text | null | NO |

## Table: CON_TIPO_DOCUMENTOS_ROLES
| Column Name | Data Type | Max Length | Nullable |
|---|---|---|---|
| id_tipo_documento_rol | integer | null | NO |
| id_tipo_documento | integer | null | NO |
| id_rol | integer | null | NO |
| cantidad_minima | integer | null | YES |
| cantidad_maxima | integer | null | YES |
| orden | integer | null | NO |

## Table: CON_TIPO_BIEN_CAMPOS
| Column Name | Data Type | Max Length | Nullable |
|---|---|---|---|
| id_tipo_bien_campo | integer | null | NO |
| id_tipo_bien | integer | null | NO |
| nombre_campo | text | null | NO |
| tipo_dato | character varying | 20 | NO |
| ancho | integer | null | YES |
| es_obligatorio | character varying | 1 | YES |
| validacion | text | null | YES |
| orden | integer | null | YES |

