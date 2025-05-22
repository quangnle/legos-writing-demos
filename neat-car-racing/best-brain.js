// Best Brain JSON -- dùng JSON object mình train được để gắn vào
const BEST_BRAIN = {
  "nodes": [
    {
      "bias": 0,
      "type": "input",
      "squash": "LOGISTIC",
      "mask": 1,
      "index": 0
    },
    {
      "bias": 0,
      "type": "input",
      "squash": "LOGISTIC",
      "mask": 1,
      "index": 1
    },
    {
      "bias": 0,
      "type": "input",
      "squash": "LOGISTIC",
      "mask": 1,
      "index": 2
    },
    {
      "bias": 0,
      "type": "input",
      "squash": "LOGISTIC",
      "mask": 1,
      "index": 3
    },
    {
      "bias": 0,
      "type": "input",
      "squash": "LOGISTIC",
      "mask": 1,
      "index": 4
    },
    {
      "bias": 0,
      "type": "input",
      "squash": "LOGISTIC",
      "mask": 1,
      "index": 5
    },
    {
      "bias": 0,
      "type": "input",
      "squash": "LOGISTIC",
      "mask": 1,
      "index": 6
    },
    {
      "bias": -0.07272300359016864,
      "type": "hidden",
      "squash": "BIPOLAR",
      "mask": 1,
      "index": 7
    },
    {
      "bias": 0.004618542558541661,
      "type": "hidden",
      "squash": "BENT_IDENTITY",
      "mask": 1,
      "index": 8
    },
    {
      "bias": 0.07249189339476791,
      "type": "hidden",
      "squash": "INVERSE",
      "mask": 1,
      "index": 9
    },
    {
      "bias": 0.07249189339476791,
      "type": "hidden",
      "squash": "INVERSE",
      "mask": 1,
      "index": 10
    },
    {
      "bias": 0.04669165493120275,
      "type": "hidden",
      "squash": "GAUSSIAN",
      "mask": 1,
      "index": 11
    },
    {
      "bias": -0.03631134433996293,
      "type": "hidden",
      "squash": "HARD_TANH",
      "mask": 1,
      "index": 12
    },
    {
      "bias": -0.028482938186921228,
      "type": "hidden",
      "squash": "SELU",
      "mask": 1,
      "index": 13
    },
    {
      "bias": -0.029388999469736873,
      "type": "hidden",
      "squash": "TANH",
      "mask": 1,
      "index": 14
    },
    {
      "bias": -0.029388999469736873,
      "type": "hidden",
      "squash": "TANH",
      "mask": 1,
      "index": 15
    },
    {
      "bias": 0.03859090576420762,
      "type": "hidden",
      "squash": "SOFTSIGN",
      "mask": 1,
      "index": 16
    },
    {
      "bias": -0.07768025884017214,
      "type": "hidden",
      "squash": "ABSOLUTE",
      "mask": 1,
      "index": 17
    },
    {
      "bias": 0.09849943294185662,
      "type": "hidden",
      "squash": "IDENTITY",
      "mask": 1,
      "index": 18
    },
    {
      "bias": -0.018180124980207713,
      "type": "hidden",
      "squash": "GAUSSIAN",
      "mask": 1,
      "index": 19
    },
    {
      "bias": 0.09849943294185662,
      "type": "hidden",
      "squash": "IDENTITY",
      "mask": 1,
      "index": 20
    },
    {
      "bias": -0.06525589168999127,
      "type": "hidden",
      "squash": "BIPOLAR_SIGMOID",
      "mask": 1,
      "index": 21
    },
    {
      "bias": 0.08308315629505358,
      "type": "hidden",
      "squash": "ABSOLUTE",
      "mask": 1,
      "index": 22
    },
    {
      "bias": 0.08308315629505358,
      "type": "hidden",
      "squash": "ABSOLUTE",
      "mask": 1,
      "index": 23
    },
    {
      "bias": -0.02580457518101867,
      "type": "output",
      "squash": "LOGISTIC",
      "mask": 1,
      "index": 24
    },
    {
      "bias": 0.006291569618527698,
      "type": "output",
      "squash": "LOGISTIC",
      "mask": 1,
      "index": 25
    },
    {
      "bias": -0.013050300465689627,
      "type": "output",
      "squash": "LOGISTIC",
      "mask": 1,
      "index": 26
    },
    {
      "bias": 0.037626918352849925,
      "type": "output",
      "squash": "LOGISTIC",
      "mask": 1,
      "index": 27
    },
    {
      "bias": -0.09293933301961499,
      "type": "output",
      "squash": "LOGISTIC",
      "mask": 1,
      "index": 28
    }
  ],
  "connections": [
    {
      "weight": 0.06427079947191744,
      "from": 19,
      "to": 28,
      "gater": null
    },
    {
      "weight": -0.06619435500931686,
      "from": 23,
      "to": 24,
      "gater": null
    },
    {
      "weight": 0.09050923240447675,
      "from": 19,
      "to": 27,
      "gater": null
    },
    {
      "weight": -0.02392668088474756,
      "from": 22,
      "to": 23,
      "gater": null
    },
    {
      "weight": -0.0490739658597728,
      "from": 15,
      "to": 28,
      "gater": null
    },
    {
      "weight": 0.005098857266592496,
      "from": 21,
      "to": 22,
      "gater": null
    },
    {
      "weight": 0.06653957279472628,
      "from": 13,
      "to": 28,
      "gater": null
    },
    {
      "weight": 0.08786680076790274,
      "from": 15,
      "to": 26,
      "gater": null
    },
    {
      "weight": 0.03016987139647065,
      "from": 20,
      "to": 21,
      "gater": null
    },
    {
      "weight": 0.06242721823753869,
      "from": 16,
      "to": 24,
      "gater": null
    },
    {
      "weight": 0.06653957279472628,
      "from": 12,
      "to": 27,
      "gater": null
    },
    {
      "weight": -0.0712547387552585,
      "from": 15,
      "to": 24,
      "gater": null
    },
    {
      "weight": -0.021506462764806722,
      "from": 11,
      "to": 27,
      "gater": null
    },
    {
      "weight": 0.00473397657003094,
      "from": 18,
      "to": 20,
      "gater": null
    },
    {
      "weight": -0.01840755836337686,
      "from": 12,
      "to": 25,
      "gater": null
    },
    {
      "weight": -0.08354825857592485,
      "from": 18,
      "to": 19,
      "gater": null
    },
    {
      "weight": 0.013570736285805893,
      "from": 17,
      "to": 18,
      "gater": null
    },
    {
      "weight": -0.09123634689640839,
      "from": 8,
      "to": 26,
      "gater": null
    },
    {
      "weight": 0.09417697268773184,
      "from": 10,
      "to": 24,
      "gater": null
    },
    {
      "weight": 2.6184970670556487,
      "from": 5,
      "to": 28,
      "gater": null
    },
    {
      "weight": 2.6184970670556487,
      "from": 5,
      "to": 27,
      "gater": null
    },
    {
      "weight": -0.05026635351572939,
      "from": 3,
      "to": 28,
      "gater": null
    },
    {
      "weight": -0.09099797492343031,
      "from": 4,
      "to": 27,
      "gater": null
    },
    {
      "weight": 3.2410980085321492,
      "from": 6,
      "to": 25,
      "gater": null
    },
    {
      "weight": 0.006739711524972589,
      "from": 2,
      "to": 28,
      "gater": null
    },
    {
      "weight": -0.08849345502509694,
      "from": 3,
      "to": 27,
      "gater": null
    },
    {
      "weight": -0.05697246739200745,
      "from": 5,
      "to": 25,
      "gater": null
    },
    {
      "weight": 0.4895083864081119,
      "from": 6,
      "to": 24,
      "gater": null
    },
    {
      "weight": 3.0605964331033464,
      "from": 1,
      "to": 28,
      "gater": null
    },
    {
      "weight": 0.09204417751880553,
      "from": 2,
      "to": 27,
      "gater": null
    },
    {
      "weight": 2.2168495957526355,
      "from": 3,
      "to": 26,
      "gater": null
    },
    {
      "weight": -0.05697246739200745,
      "from": 5,
      "to": 24,
      "gater": null
    },
    {
      "weight": 0.009100112920680442,
      "from": 14,
      "to": 15,
      "gater": null
    },
    {
      "weight": 3.0605964331033464,
      "from": 1,
      "to": 27,
      "gater": null
    },
    {
      "weight": 2.558331160461981,
      "from": 4,
      "to": 24,
      "gater": null
    },
    {
      "weight": -0.060707583149763544,
      "from": 12,
      "to": 16,
      "gater": null
    },
    {
      "weight": 2.310341059931904,
      "from": 2,
      "to": 25,
      "gater": null
    },
    {
      "weight": 1.6621541045814179,
      "from": 3,
      "to": 24,
      "gater": null
    },
    {
      "weight": 1.190321296558107,
      "from": 1,
      "to": 25,
      "gater": null
    },
    {
      "weight": 1.4507709852216166,
      "from": 0,
      "to": 25,
      "gater": null
    },
    {
      "weight": 0.09252319866304487,
      "from": 10,
      "to": 13,
      "gater": null
    },
    {
      "weight": 0.46524934699269227,
      "from": 11,
      "to": 12,
      "gater": null
    },
    {
      "weight": 0.02308069946109266,
      "from": 2,
      "to": 20,
      "gater": null
    },
    {
      "weight": -0.0015713191354068262,
      "from": 6,
      "to": 14,
      "gater": null
    },
    {
      "weight": -0.770653733059633,
      "from": 5,
      "to": 14,
      "gater": null
    },
    {
      "weight": -0.645280387248017,
      "from": 6,
      "to": 13,
      "gater": null
    },
    {
      "weight": -0.05324485381455464,
      "from": 9,
      "to": 10,
      "gater": null
    },
    {
      "weight": 0.09690885229942245,
      "from": 2,
      "to": 16,
      "gater": null
    },
    {
      "weight": -0.3512422872886987,
      "from": 0,
      "to": 17,
      "gater": null
    },
    {
      "weight": 0.03182643203941882,
      "from": 5,
      "to": 12,
      "gater": null
    },
    {
      "weight": -0.09258699366783592,
      "from": 8,
      "to": 9,
      "gater": null
    },
    {
      "weight": 0.08276831041778318,
      "from": 2,
      "to": 14,
      "gater": null
    },
    {
      "weight": -0.09258699366783592,
      "from": 7,
      "to": 8,
      "gater": null
    },
    {
      "weight": 0.016273658568237634,
      "from": 1,
      "to": 13,
      "gater": null
    },
    {
      "weight": 0.05666867782434315,
      "from": 6,
      "to": 8,
      "gater": null
    },
    {
      "weight": 0.0334758194147306,
      "from": 6,
      "to": 7,
      "gater": null
    },
    {
      "weight": -0.7887844619953015,
      "from": 0,
      "to": 11,
      "gater": null
    }
  ],
  "input": 7,
  "output": 5,
  "dropout": 0
}
