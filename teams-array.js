const TEAMS = [
  // ABB
  { id: 1, company: "ABB", department: "HVC", team: "Skift 1", url: "https://www.skiftschema.se/schema/abb_hvc_5skift/1" },
  { id: 2, company: "ABB", department: "HVC", team: "Skift 2", url: "https://www.skiftschema.se/schema/abb_hvc_5skift/2" },
  { id: 3, company: "ABB", department: "HVC", team: "Skift 3", url: "https://www.skiftschema.se/schema/abb_hvc_5skift/3" },
  { id: 4, company: "ABB", department: "HVC", team: "Skift 4", url: "https://www.skiftschema.se/schema/abb_hvc_5skift/4" },
  { id: 5, company: "ABB", department: "HVC", team: "Skift 5", url: "https://www.skiftschema.se/schema/abb_hvc_5skift/5" },

  // Aga Avesta
  { id: 6, company: "Aga", department: "Avesta", team: "A-lag", url: "https://www.skiftschema.se/schema/aga_avesta_6skift/A" },
  { id: 7, company: "Aga", department: "Avesta", team: "B-lag", url: "https://www.skiftschema.se/schema/aga_avesta_6skift/B" },
  { id: 8, company: "Aga", department: "Avesta", team: "C-lag", url: "https://www.skiftschema.se/schema/aga_avesta_6skift/C" },
  { id: 9, company: "Aga", department: "Avesta", team: "D-lag", url: "https://www.skiftschema.se/schema/aga_avesta_6skift/D" },
  { id: 10, company: "Aga", department: "Avesta", team: "E-lag", url: "https://www.skiftschema.se/schema/aga_avesta_6skift/E" },
  { id: 11, company: "Aga", department: "Avesta", team: "F-lag", url: "https://www.skiftschema.se/schema/aga_avesta_6skift/F" },

  // Arctic Paper Grycksbo
  { id: 12, company: "Arctic Paper", department: "Grycksbo", team: "Lag-1", url: "https://www.skiftschema.se/schema/arctic_paper_grycksbo_3skift/1" },
  { id: 13, company: "Arctic Paper", department: "Grycksbo", team: "Lag-2", url: "https://www.skiftschema.se/schema/arctic_paper_grycksbo_3skift/2" },
  { id: 14, company: "Arctic Paper", department: "Grycksbo", team: "Lag-3", url: "https://www.skiftschema.se/schema/arctic_paper_grycksbo_3skift/3" },
  { id: 15, company: "Arctic Paper", department: "Grycksbo", team: "Lag-4", url: "https://www.skiftschema.se/schema/arctic_paper_grycksbo_3skift/4" },
  { id: 16, company: "Arctic Paper", department: "Grycksbo", team: "Lag-5", url: "https://www.skiftschema.se/schema/arctic_paper_grycksbo_3skift/5" },

  // Avesta 6-veckors nattschema
  { id: 17, company: "Avesta", department: "6v Natt", team: "Grupp 1", url: "https://www.skiftschema.se/schema/avesta_6v_nattschema/1" },
  { id: 18, company: "Avesta", department: "6v Natt", team: "Grupp 2", url: "https://www.skiftschema.se/schema/avesta_6v_nattschema/2" },
  { id: 19, company: "Avesta", department: "6v Natt", team: "Grupp 3", url: "https://www.skiftschema.se/schema/avesta_6v_nattschema/3" },
  { id: 20, company: "Avesta", department: "6v Natt", team: "Grupp 4", url: "https://www.skiftschema.se/schema/avesta_6v_nattschema/4" },
  { id: 21, company: "Avesta", department: "6v Natt", team: "Grupp 5", url: "https://www.skiftschema.se/schema/avesta_6v_nattschema/5" },
  { id: 22, company: "Avesta", department: "6v Natt", team: "Grupp 6", url: "https://www.skiftschema.se/schema/avesta_6v_nattschema/6" },

  // Barilla Sverige Filipstad
  { id: 23, company: "Barilla", department: "Filipstad", team: "Lag 1", url: "https://www.skiftschema.se/schema/barilla_sverige_filipstad/1" },
  { id: 24, company: "Barilla", department: "Filipstad", team: "Lag 2", url: "https://www.skiftschema.se/schema/barilla_sverige_filipstad/2" },
  { id: 25, company: "Barilla", department: "Filipstad", team: "Lag 3", url: "https://www.skiftschema.se/schema/barilla_sverige_filipstad/3" },
  { id: 26, company: "Barilla", department: "Filipstad", team: "Lag 4", url: "https://www.skiftschema.se/schema/barilla_sverige_filipstad/4" },
  { id: 27, company: "Barilla", department: "Filipstad", team: "Lag 5", url: "https://www.skiftschema.se/schema/barilla_sverige_filipstad/5" },

  // Billerudkorsnäs Gruvön Grums
  { id: 28, company: "Billerudkorsnäs", department: "Gruvön Grums", team: "Lag A", url: "https://www.skiftschema.se/schema/billerudkorsnas_gruvon_grums/A" },
  { id: 29, company: "Billerudkorsnäs", department: "Gruvön Grums", team: "Lag B", url: "https://www.skiftschema.se/schema/billerudkorsnas_gruvon_grums/B" },
  { id: 30, company: "Billerudkorsnäs", department: "Gruvön Grums", team: "Lag C", url: "https://www.skiftschema.se/schema/billerudkorsnas_gruvon_grums/C" },
  { id: 31, company: "Billerudkorsnäs", department: "Gruvön Grums", team: "Lag D", url: "https://www.skiftschema.se/schema/billerudkorsnas_gruvon_grums/D" },
  { id: 32, company: "Billerudkorsnäs", department: "Gruvön Grums", team: "Lag E", url: "https://www.skiftschema.se/schema/billerudkorsnas_gruvon_grums/E" },

  // Boliden Aitik Gruva
  { id: 33, company: "Boliden", department: "Aitik Gruva", team: "Lag 1", url: "https://www.skiftschema.se/schema/boliden_aitik_gruva_k3/1" },
  { id: 34, company: "Boliden", department: "Aitik Gruva", team: "Lag 2", url: "https://www.skiftschema.se/schema/boliden_aitik_gruva_k3/2" },
  { id: 35, company: "Boliden", department: "Aitik Gruva", team: "Lag 3", url: "https://www.skiftschema.se/schema/boliden_aitik_gruva_k3/3" },

  // SSAB
  { id: 36, company: "SSAB", department: "Borlänge", team: "A-skift", url: "https://www.skiftschema.se/schema/ssab_borlange_5skift/A" },
  { id: 37, company: "SSAB", department: "Borlänge", team: "B-skift", url: "https://www.skiftschema.se/schema/ssab_borlange_5skift/B" },
  { id: 38, company: "SSAB", department: "Borlänge", team: "C-skift", url: "https://www.skiftschema.se/schema/ssab_borlange_5skift/C" },
  { id: 39, company: "SSAB", department: "Borlänge", team: "D-skift", url: "https://www.skiftschema.se/schema/ssab_borlange_5skift/D" },
  { id: 40, company: "SSAB", department: "Borlänge", team: "E-skift", url: "https://www.skiftschema.se/schema/ssab_borlange_5skift/E" },

  // SSAB Oxelösund
  { id: 41, company: "SSAB", department: "Oxelösund", team: "A-skift", url: "https://www.skiftschema.se/schema/ssab_oxelosund_5skift/A" },
  { id: 42, company: "SSAB", department: "Oxelösund", team: "B-skift", url: "https://www.skiftschema.se/schema/ssab_oxelosund_5skift/B" },
  { id: 43, company: "SSAB", department: "Oxelösund", team: "C-skift", url: "https://www.skiftschema.se/schema/ssab_oxelosund_5skift/C" },
  { id: 44, company: "SSAB", department: "Oxelösund", team: "D-skift", url: "https://www.skiftschema.se/schema/ssab_oxelosund_5skift/D" },
  { id: 45, company: "SSAB", department: "Oxelösund", team: "E-skift", url: "https://www.skiftschema.se/schema/ssab_oxelosund_5skift/E" },

  // LKAB
  { id: 46, company: "LKAB", department: "Kiruna", team: "A-skift", url: "https://www.skiftschema.se/schema/lkab_kiruna_5skift/A" },
  { id: 47, company: "LKAB", department: "Kiruna", team: "B-skift", url: "https://www.skiftschema.se/schema/lkab_kiruna_5skift/B" },
  { id: 48, company: "LKAB", department: "Kiruna", team: "C-skift", url: "https://www.skiftschema.se/schema/lkab_kiruna_5skift/C" },
  { id: 49, company: "LKAB", department: "Kiruna", team: "D-skift", url: "https://www.skiftschema.se/schema/lkab_kiruna_5skift/D" },
  { id: 50, company: "LKAB", department: "Kiruna", team: "E-skift", url: "https://www.skiftschema.se/schema/lkab_kiruna_5skift/E" },

  // LKAB Malmberget
  { id: 51, company: "LKAB", department: "Malmberget", team: "A-skift", url: "https://www.skiftschema.se/schema/lkab_malmberget_5skift/A" },
  { id: 52, company: "LKAB", department: "Malmberget", team: "B-skift", url: "https://www.skiftschema.se/schema/lkab_malmberget_5skift/B" },
  { id: 53, company: "LKAB", department: "Malmberget", team: "C-skift", url: "https://www.skiftschema.se/schema/lkab_malmberget_5skift/C" },
  { id: 54, company: "LKAB", department: "Malmberget", team: "D-skift", url: "https://www.skiftschema.se/schema/lkab_malmberget_5skift/D" },
  { id: 55, company: "LKAB", department: "Malmberget", team: "E-skift", url: "https://www.skiftschema.se/schema/lkab_malmberget_5skift/E" },

  // Stora Enso
  { id: 56, company: "Stora Enso", department: "Nymölla", team: "A-lag", url: "https://www.skiftschema.se/schema/stora_enso_nymolla_5skift/A" },
  { id: 57, company: "Stora Enso", department: "Nymölla", team: "B-lag", url: "https://www.skiftschema.se/schema/stora_enso_nymolla_5skift/B" },
  { id: 58, company: "Stora Enso", department: "Nymölla", team: "C-lag", url: "https://www.skiftschema.se/schema/stora_enso_nymolla_5skift/C" },
  { id: 59, company: "Stora Enso", department: "Nymölla", team: "D-lag", url: "https://www.skiftschema.se/schema/stora_enso_nymolla_5skift/D" },
  { id: 60, company: "Stora Enso", department: "Nymölla", team: "E-lag", url: "https://www.skiftschema.se/schema/stora_enso_nymolla_5skift/E" },

  // Stora Enso Fors
  { id: 61, company: "Stora Enso", department: "Fors", team: "A-lag", url: "https://www.skiftschema.se/schema/stora_enso_fors_5skift/A" },
  { id: 62, company: "Stora Enso", department: "Fors", team: "B-lag", url: "https://www.skiftschema.se/schema/stora_enso_fors_5skift/B" },
  { id: 63, company: "Stora Enso", department: "Fors", team: "C-lag", url: "https://www.skiftschema.se/schema/stora_enso_fors_5skift/C" },
  { id: 64, company: "Stora Enso", department: "Fors", team: "D-lag", url: "https://www.skiftschema.se/schema/stora_enso_fors_5skift/D" },
  { id: 65, company: "Stora Enso", department: "Fors", team: "E-lag", url: "https://www.skiftschema.se/schema/stora_enso_fors_5skift/E" },

  // Holmen Paper
  { id: 66, company: "Holmen", department: "Hallsta", team: "A-lag", url: "https://www.skiftschema.se/schema/holmen_hallsta_5skift/A" },
  { id: 67, company: "Holmen", department: "Hallsta", team: "B-lag", url: "https://www.skiftschema.se/schema/holmen_hallsta_5skift/B" },
  { id: 68, company: "Holmen", department: "Hallsta", team: "C-lag", url: "https://www.skiftschema.se/schema/holmen_hallsta_5skift/C" },
  { id: 69, company: "Holmen", department: "Hallsta", team: "D-lag", url: "https://www.skiftschema.se/schema/holmen_hallsta_5skift/D" },
  { id: 70, company: "Holmen", department: "Hallsta", team: "E-lag", url: "https://www.skiftschema.se/schema/holmen_hallsta_5skift/E" },

  // Sandvik
  { id: 71, company: "Sandvik", department: "Sandviken", team: "A-skift", url: "https://www.skiftschema.se/schema/sandvik_sandviken_5skift/A" },
  { id: 72, company: "Sandvik", department: "Sandviken", team: "B-skift", url: "https://www.skiftschema.se/schema/sandvik_sandviken_5skift/B" },
  { id: 73, company: "Sandvik", department: "Sandviken", team: "C-skift", url: "https://www.skiftschema.se/schema/sandvik_sandviken_5skift/C" },
  { id: 74, company: "Sandvik", department: "Sandviken", team: "D-skift", url: "https://www.skiftschema.se/schema/sandvik_sandviken_5skift/D" },
  { id: 75, company: "Sandvik", department: "Sandviken", team: "E-skift", url: "https://www.skiftschema.se/schema/sandvik_sandviken_5skift/E" }
];

module.exports = TEAMS;