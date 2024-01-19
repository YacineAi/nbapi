const axios = require('axios');
const crypto = require("crypto");
const cheerio = require('cheerio');
const express = require('express');
const app = express();
const https = require('https');

const API_URL = "https://api-sg.aliexpress.com/sync";
const API_SECRET = process.env.SECRET;

const hash = (method, s, format) => {
  const sum = crypto.createHash(method);
  const isBuffer = Buffer.isBuffer(s);
  if (!isBuffer && typeof s === "object") {
    s = JSON.stringify(sortObject(s));
  }
  sum.update(s, "utf8");
  return sum.digest(format || "hex");
};

const sortObject = (obj) => {
  return Object.keys(obj)
    .sort()
    .reduce(function (result, key) {
      result[key] = obj[key];
      return result;
    }, {});
};

const signRequest = (parameters) => {
  const sortedParams = sortObject(parameters);
  const sortedString = Object.keys(sortedParams).reduce((acc, objKey) => {
    return `${acc}${objKey}${sortedParams[objKey]}`;
  }, "");
  const bookstandString = `${API_SECRET}${sortedString}${API_SECRET}`;
  const signedString = hash("md5", bookstandString, "hex");
  return signedString.toUpperCase();
};

app.use(express.json());

app.get('/', (req, res) => {
  res.sendStatus(200)
});

app.get('/ping', (req, res) => {
  res.status(200).json({ message: 'Ping successful' });
});

function keepAppRunning() {
  setInterval(() => {
    https.get(`${process.env.RENDER_EXTERNAL_URL}/ping`, (resp) => {
      if (resp.statusCode === 200) {
        console.log('Ping successful');
      } else {
        console.error('Ping failed');
      }
    });
  }, 5 * 60 * 1000);
}

app.get('/fetch', async (req, res) => {
  const { id } = req.query;
  const { region } = req.query;
  const defaultRegion = region || "DZ";
  const cookier = () => {
    if (defaultRegion == "DZ") {
      return "ali_apache_id=33.3.20.111.1702585962650.678888.4; acs_usuc_t=x_csrf=8nx8qrep9exs&acs_rt=485dca3186c64e8eb354206aba5405ac; AKA_A2=A; _m_h5_tk=10ba1bb6aecdb672824f066d0c526c8e_1702587856981; _m_h5_tk_enc=7750008d64513183ab439d261cee7b17; e_id=pt70; xlly_s=1; _gid=GA1.2.2136155133.1702585970; _gcl_au=1.1.1695213607.1702585971; cna=c1QCHmBmNB0CAYEteA6D0PDJ; account_v=1; _ym_uid=170258597425757114; _ym_d=1702585974; _ym_isad=1; _ym_visorc=b; AB_DATA_TRACK=472051_617389.455637_622998; AB_ALG=global_union_ab_exp_4%3D2; AB_STG=st_StrategyExp_1694492533501%23stg_687%2Cst_StrategyExp_1695711618618%23stg_685; af_ss_a=1; af_ss_b=1; aep_history=keywords%5E%0Akeywords%09%0A%0Aproduct_selloffer%5E%0Aproduct_selloffer%091005005943671094; intl_locale=ar_MA; XSRF-TOKEN=f90e5229-8dc7-4bd7-a5e3-f03fa9541960; RT=\"z=1&dm=aliexpress.com&si=cf719887-f5c6-49cc-9e93-09699f7761ed&ss=lq5nq879&sl=2&tt=3lo&rl=1&obo=1&ld=2tuk&r=1esw5xemv&ul=2tuk&hd=2ujp\"; havana_tgc=NTGC_4af064990ad42b76e65b44deb0d4128c; _hvn_login=13; x_router_us_f=x_alimid=2720217087; xman_us_t=x_lid=dz1119513087freae&sign=y&rmb_pp=louktila.tk@gmail.com&x_user=FsvZqhzjyC9N9r8UfDqcE8ih7ZaPp9x036ieR7TlWMU=&ctoken=1457kqo8xl7w6&l_source=aliexpress; sgcookie=E100e+PgE32vvuBs4RRbDK1/zcDuOBbY237w+8jCee44/xRljlTdh9V7S7XjXrXg7XrMIcKRzLdmDBiY3MwCpgdUie3P/u9LPMTBVfMa1zCbh8I=; aep_common_f=M+l0+zh1HyHwhuSym0X5YTLkksVK+YKNYp/kuSyps1g4xwkHRoCd3w==; xman_f=1mXsCY+Xl+n3EYdOjIl0/gBLz2Hiqv5U8ewzhAivdy/AiLbLiHXPyLLTUKdWdMYzg3lYH2BIL0DQ3NtqsS/hVyDAb328KQ048sO8Entkv/90t50Tj0cG8IkWwRMvsCUeGick5+SuChArwIW+W2AzmtdYlpJQPoQGPV/nMpT7z02qYZM6bDNYtdpO+Z43PWnoV2sR12ssnkw7bI/2SVT7K6WPLFQxoTNhr6cbX7hBDigFiSsD+R4L7bMADU18JjIa5zhoMfBKoVzUFbh2kyrMn/FbQaXidluAwS6jFit8l/Sq5zd4jsFQzTmkzL1Z1eWXq5h+Zv03q1iMa/MPUTEnfv4j0wdMAK3bP0GVdfdBQC/v+wGV+kkJSAPxRyWe1mlYpMsmcKsvlur4X5w7Ta0GBQ5L3PhEdXfhpCY5f30wBQVlDvBvNG+bZyhhE4fAXhmycQ91+vWfAN0xnFVzQunDxA==; aep_usuc_f=site=ara&province=null&city=null&c_tp=USD&x_alimid=2720217087&isb=y&region=DZ&b_locale=ar_MA; ali_apache_track=mt=1|ms=|mid=dz1119513087freae; ali_apache_tracktmp=W_signed=Y; xman_us_f=x_locale=ar_MA&x_l=0&x_user=DZ|hacking|baka|ifm|2720217087&x_lid=dz1119513087freae&x_c_chg=0&acs_rt=485dca3186c64e8eb354206aba5405ac; _gat=1; JSESSIONID=DA1BE1F197FF4F063B97905DBBC9B65F; intl_common_forever=o0NI+d3m22lDNIOpetIWYrPDmaEuTFX4k4J6EKg8n5Ho6+TAmNc8mA==; xman_t=rfJ6i7unnKWyVhPN9Bz+YeUZJbWDcqLG5/oQ5LlvC6swKPUopd5rffHDjw9J0iI5VNxH7lB7S+hTBUaUe/0KVszcCLs8U/vEbVyTNAoqcfJoLFgB/Jp66IHIe+dX1H9DjoXr9IIdp/4mB1S+j/fVPbqmawcBpAujEPY3yUMl0x5+Yh/vAaKLCsAjnT2mf/8xlx/QJU4TFjlnBpIK+huny8o/cItt6JaEn9n4GnMyeY03YgmWKuLUwR4GL9ut1vKYcB2i75S6nruLzfnn9OuMR4Fn/eFHkhnGAG86CbF4VWCbrvJkj1Kp6r5U/R33856wKg4SPUrDTzc35DmZSORxn4OPq3i++b4Sf4nSD83uNh1oH7uohhdGC0JdbYsT88nJZAJBDEZ8aDRznGLcMUhRnXHewEgoRovgnMYQjlL3pvxk5WBZN+CQsKWVPOWUq+lb+FycZpzNhs0kU0G/q8WvWomhb7L0sc9BGk9fiyfHViBfJTyaa9BrDr/gyhDc9A1u08akHsGgpzfx7Z40yqLxGqer1UHLhj3NhtFgsO2MelsHeZLpzal9r6iZp2WAp8B7r12atKjxwqJEZz7ik33Hhp32U+2AZ5gz68Jn/5pKbaPbvvBox/Vi+MAFMascZ4lO6BrKFptyl3g83B89+pyBVPNE5a9QgmPrUEkmMxbxicGlqDwZxPlsVdF5ntaeVNVDBaXBWYlFv32GW9zLSFCWCeUaqcl0XcfYR7GTOjBhubfaqRXsv10/bMoCGgdXR1Vo; tfstk=e_427FYM-ZQ2RrOQ000Z85gZa23x-2BBSPMss5ViGxDcDcZr78e4cdgsfFkgsYajhSgc7f2QUxcmSVYuZfheiFDmsL0o6j8ijPM_71uYPoTsht3asJgNd9_CRSFxyVXCdKgJMwuTMF97WwNYMQ4VbySFRFWgHiShDbjWiEnGKWHurvZPEnj8GY8M7LhqmvbKUFYgzjPrKSjpSF4rgmIP8dhuDWUT0dxZmbhrd_5rLhogMKuY4k-9X00Kav1jGhKtmbhrd_5yXhnoebkCGj1..; l=fBIaWgPRPcvgi6lsBOfwPurza77OSIRAguPzaNbMi9fPOD5w5MmRB1UinYLeC3MNFsQvR3S3hc2kBeYBqQAonxvOw1MjP4Mmnttb57C..; isg=BF1db82O5Idjx4Cr6aHSjiL2bDlXepHMSVD95B8imbTj1n0I58qhnCtEANJQFqmE; _ga_VED1YSGNC7=GS1.1.1702585971.1.1.1702586521.14.0.0; _ga=GA1.1.885247232.1702585970; cto_bundle=irfJol9oQ1RMb080OXRmSyUyQkFnNGNHUGpJN0hQMzA3TnVXRjY3Um5BSlo1MFNPZGhteDYyUFQlMkZRMEU4Z0FsUzM3VCUyRjhxMFhTQ1FBYTBOMVJKSyUyQmMlMkZWR3pUSGZ3c25LT3pVcmR3NngwckhNUGc3Y3Y1a0JSY2ozVm1zenclMkJpNXB4OEs4Qg"
    } else {
      return "ali_apache_id=33.3.20.111.1702585962650.678888.4; acs_usuc_t=x_csrf=8nx8qrep9exs&acs_rt=485dca3186c64e8eb354206aba5405ac; AKA_A2=A; _m_h5_tk=10ba1bb6aecdb672824f066d0c526c8e_1702587856981; _m_h5_tk_enc=7750008d64513183ab439d261cee7b17; e_id=pt70; xlly_s=1; _gid=GA1.2.2136155133.1702585970; _gcl_au=1.1.1695213607.1702585971; cna=c1QCHmBmNB0CAYEteA6D0PDJ; account_v=1; _ym_uid=170258597425757114; _ym_d=1702585974; _ym_isad=1; _ym_visorc=b; AB_DATA_TRACK=472051_617389.455637_622998; AB_ALG=global_union_ab_exp_4%3D2; AB_STG=st_StrategyExp_1694492533501%23stg_687%2Cst_StrategyExp_1695711618618%23stg_685; af_ss_a=1; af_ss_b=1; aep_history=keywords%5E%0Akeywords%09%0A%0Aproduct_selloffer%5E%0Aproduct_selloffer%091005005943671094; intl_locale=ar_MA; XSRF-TOKEN=f90e5229-8dc7-4bd7-a5e3-f03fa9541960; RT=\"z=1&dm=aliexpress.com&si=cf719887-f5c6-49cc-9e93-09699f7761ed&ss=lq5nq879&sl=2&tt=3lo&rl=1&obo=1&ld=2tuk&r=1esw5xemv&ul=2tuk&hd=2ujp\"; havana_tgc=NTGC_4af064990ad42b76e65b44deb0d4128c; _hvn_login=13; x_router_us_f=x_alimid=2720217087; xman_us_t=x_lid=dz1119513087freae&sign=y&rmb_pp=louktila.tk@gmail.com&x_user=FsvZqhzjyC9N9r8UfDqcE8ih7ZaPp9x036ieR7TlWMU=&ctoken=1457kqo8xl7w6&l_source=aliexpress; sgcookie=E100e+PgE32vvuBs4RRbDK1/zcDuOBbY237w+8jCee44/xRljlTdh9V7S7XjXrXg7XrMIcKRzLdmDBiY3MwCpgdUie3P/u9LPMTBVfMa1zCbh8I=; aep_common_f=M+l0+zh1HyHwhuSym0X5YTLkksVK+YKNYp/kuSyps1g4xwkHRoCd3w==; xman_f=1mXsCY+Xl+n3EYdOjIl0/gBLz2Hiqv5U8ewzhAivdy/AiLbLiHXPyLLTUKdWdMYzg3lYH2BIL0DQ3NtqsS/hVyDAb328KQ048sO8Entkv/90t50Tj0cG8IkWwRMvsCUeGick5+SuChArwIW+W2AzmtdYlpJQPoQGPV/nMpT7z02qYZM6bDNYtdpO+Z43PWnoV2sR12ssnkw7bI/2SVT7K6WPLFQxoTNhr6cbX7hBDigFiSsD+R4L7bMADU18JjIa5zhoMfBKoVzUFbh2kyrMn/FbQaXidluAwS6jFit8l/Sq5zd4jsFQzTmkzL1Z1eWXq5h+Zv03q1iMa/MPUTEnfv4j0wdMAK3bP0GVdfdBQC/v+wGV+kkJSAPxRyWe1mlYpMsmcKsvlur4X5w7Ta0GBQ5L3PhEdXfhpCY5f30wBQVlDvBvNG+bZyhhE4fAXhmycQ91+vWfAN0xnFVzQunDxA==; ali_apache_track=mt=1|ms=|mid=dz1119513087freae; ali_apache_tracktmp=W_signed=Y; cto_bundle=mS_5yF9oQ1RMb080OXRmSyUyQkFnNGNHUGpJN0hFV3RKREQxTlNIJTJCOUFjJTJCdXFQc2NqM1JpMlp6cHk3ajNmNlFvdUN4WEZING9WY3J2ZUhqNkJHTW92N1hpZGhyaVV2aXBSRWdNJTJCaXlxMSUyRllNenU4aTlHeklwUVIyS3ZYQkVrbGklMkZYVHBuVg; _ga=GA1.1.885247232.1702585970; aep_usuc_f=site=ara&province=null&city=null&c_tp=USD&x_alimid=2720217087&isb=y&region=MA&b_locale=ar_MA; xman_us_f=x_locale=ar_MA&x_l=0&x_user=DZ|hacking|baka|ifm|2720217087&x_lid=dz1119513087freae&x_c_chg=0&acs_rt=485dca3186c64e8eb354206aba5405ac; _ga_VED1YSGNC7=GS1.1.1702585971.1.1.1702586719.1.0.0; JSESSIONID=231040B7F0CFC0E8CFD541DA976BA7F9; intl_common_forever=b3gBP7EcaZRx0S/H9Z0+jBIeSwIkXJ744jFOaU59XeQyra04VnWtZQ==; xman_t=E2mVTpC27TZSuF+BN4q4bDnEPi+M9urlBGmGFNqF5/lPkQVJ7P+kLwKO3vMjMtD5FtE0z27PJ5AWVu9wTXn9B28aZX6FKZRsubgYtTCDulP7ajH1tTtEy2ux3UJ982WM35jgaZjLDc0AHDVOazRvptcMgn9Axvhs7rNRWb8dPCBcyxtZi0jCrZesbGUxhu4A7h/IgZ7/OKvX7zDL68MlBDVzLwZa9WMe/F8UHNfMSQuV0HsV7Gw2MPp63m7Ab7s0STQZ092xUHC8o+IJ0pjDYv3HFhipwp/jyerj/g6mRg0shWI6I6km5w/rTsSXifxJkf5ILpfbB2fqM+tUs+jBaH/YvWldzz6c6xu5BZLmGn/EblZWbUfGFlDSZZKfDxVxUJYnMvRasw5/6Uz1DZnM0Qz9422w1hQ4GDaNhu9AW6QEJGEWCd/K3p5rgCny+rAb7QabSY0ldKu2s+W++apqChDom8xqKov1AN3XENnmNhGezL3rF7HJaqBlaUoQkrRzXM8XhdmVdOUUaH1hV6ybVugABNDc4/ZVgqD0pnnywdCwqH4I2Kb21auDOOjp0Vdtv66HMhq8SRL+XNgG61QBtRcPUZlWM+soPuLD139is2Vekp1a9M2L+u0TBvQSAuTABWaJMgZtRouV1PlmRJOWOkbr7UHaRHtCmOt4/YnKF9z7bGfRwoEoXkNcFy3NDSO+6YEVO0S8vA1R3gr0K+rYYD/VfrqBXpwJ+jTqSOXEbauR92T5/VyO1J0itwLiQm+5; tfstk=eNe270vMKtB2d-tQgbDZLlgN39MxCvQBIRgsjlqicq0cMfNrQzU4GFMs1dugj4wjloMcQc4QzqmmIAvuqcnemd0mjUDoXmJisRg_QGkYFS9slZHajyMNRw6CdoExeAbCRPlyFzHTDdT7B9ZYD3V8j5rAdd7glOSnNA7ei3hP-k3uE2NqRdbLq4JMQUnqi2XKzdvgUmrr-ofpId2r0jIz8FnuMkeTgFAZi0nrRgSr8ClgDEkYaWR96bDK42sjcCdti0nrRgSy6Choy0uCcm1..; l=fBIaWgPRPcvgipttBOfwPurza77OSIRAguPzaNbMi9fP9sCp5juAB1Ui3XL9C3MNF6kMR3S3hc2kBeYBqIvnQ61Gw1MjP4Mmn_vWSGf..; isg=BMTEsE9KfcwzcMmA6CbbFXOJlUK23ehHeP90z95lUA9SCWTTBu241_qrSbnRESCf"
    }
  };

  const headers = {
    "cookie": cookier()
  };

  const payload = {
    app_key: "503698",
    sign_method: "md5",
    timestamp: new Date().toISOString().slice(0, 19).replace('T', ' '),
    format: "json",
    v: "2.0",
    method: "aliexpress.affiliate.link.generate",
    promotion_link_type: 0,
    tracking_id: "Yacine",
    source_values: `https://ar.aliexpress.com/i/${id}.html,https://ar.aliexpress.com/i/${id}.html?sourceType=620&aff_fcid=,https://ar.aliexpress.com/i/${id}.html?sourceType=562&aff_fcid=,https://ar.aliexpress.com/i/${id}.html?sourceType=561&aff_fcid=`,
  };
  const sign = signRequest(payload);
  const allParams = {
    ...payload,
    sign,
  };

  try {
    const result = {};

    const requests = [
      axios.get(`https://ar.aliexpress.com/item/${id}.html`, { headers }),
      axios.get(`https://ar.aliexpress.com/i/${id}.html?sourceType=620&aff_fcid=`, { headers }),
      axios.get(`https://ar.aliexpress.com/i/${id}.html?sourceType=562&aff_fcid=`, { headers }),
      axios.get(`https://ar.aliexpress.com/i/${id}.html?sourceType=561&aff_fcid=`, { headers }),
      axios.post(API_URL, new URLSearchParams(allParams))
    ];

    const responses = await Promise.all(requests);

    responses.forEach((response, index) => {
      console.log(response.data)
      if (index == 4) {
        const mappedData = response.data.aliexpress_affiliate_link_generate_response.resp_result.result.promotion_links.promotion_link.reduce((res, item) => {
          const sourceValue = item.source_value;
          let key = 'normal';
          if (sourceValue) {
              if (sourceValue.includes('sourceType=561')) {
              key = 'limited';
            } else if (sourceValue.includes('sourceType=562')) {
              key = 'super';
            } else if (sourceValue.includes('sourceType=620')) {
              key = 'points';
            }
          }
          res[key] = item.promotion_link;
          return res;
        }, {});
        result['aff'] = mappedData;
      } else {
        const $ = cheerio.load(response.data);
      const html = $('script:contains("window.runParams")');
      const content = html.html();
      const match = /window\.runParams\s*=\s*({.*?});/s.exec(content);

      if (match && match[1] && match[1].length > 1000) {
        const data = eval(`(${match[1]})`);

        switch (index) {
          case 0: // Normal
          var shipping = () => {
            if (data.data.webGeneralFreightCalculateComponent.originalLayoutResultList[0].bizData.displayAmount == undefined) {
              return "free"
            } else {
              return data.data.webGeneralFreightCalculateComponent.originalLayoutResultList[0].bizData.displayAmount
            }
          };
          
          var discount = () => {
            if (data.data.priceComponent.coinDiscountText == undefined) {
              return "none"
            } else {
              return data.data.priceComponent.coinDiscountText
            }
          };

          var coupon = () => {
            if (data.data.webCouponInfoComponent.promotionPanelDTO.shopCoupon == undefined) {
              return "none"
            } else {
              let copo = []
              for (const promotion of data.data.webCouponInfoComponent.promotionPanelDTO.shopCoupon) {
                for (const coupon of promotion.promotionPanelDetailDTOList) {
                  const content = {
                    code: coupon.attributes.couponCode,
                    detail: coupon.promotionDetail,
                    desc: coupon.promotionDesc,
                  };
                  copo.push(content)
                }
              }
              return copo
            }
          };
          
          var shippingInfo = () => {

            if (data.data.webGeneralFreightCalculateComponent.originalLayoutResultList[0].bizData.unreachable && data.data.webGeneralFreightCalculateComponent.originalLayoutResultList[0].bizData.unreachable == true) {
              var nonDz = { dz: false };
              return nonDz;
            } else {
              var info = {
                type: data.data.webGeneralFreightCalculateComponent.originalLayoutResultList[0].bizData.deliveryProviderName,
                source: data.data.webGeneralFreightCalculateComponent.originalLayoutResultList[0].bizData.shipFromCode,
                deliverDate: data.data.webGeneralFreightCalculateComponent.originalLayoutResultList[0].bizData.deliveryDate,
                deliverRange: `${data.data.webGeneralFreightCalculateComponent.originalLayoutResultList[0].bizData.deliveryDayMin}-${data.data.webGeneralFreightCalculateComponent.originalLayoutResultList[0].bizData.guaranteedDeliveryTime}`
              };
              return info;
            }
          };

          var shaped = {
            name: data.data.metaDataComponent.title.replace("| |   - AliExpress", "").replace("|", " "),
            image: data.data.imageComponent.imagePathList[0],
            shipping: shipping(),
            shippingInfo: shippingInfo(),
            rate: data.data.feedbackComponent.evarageStar,
            totalRates: data.data.feedbackComponent.totalValidNum,
            price: data.data.priceComponent.origPrice.minAmount.value,
            discountPrice: data.data.priceComponent.discountPrice.minActivityAmount != undefined && data.data.priceComponent.discountPrice.minActivityAmount.value || "No discount Price",
            sales: parseInt(data.data.tradeComponent.formatTradeCount.match(/\d+/g)[0]),
            discount: discount(),
            coupon: coupon(),
            store: data.data.sellerComponent.storeName,
            storeRate: data.data.storeFeedbackComponent.sellerPositiveRate
          };
          
          result['normal'] = shaped;
          break;
          case 1: // Points
          var discount = () => {
            if (data.data.priceComponent.coinDiscountText == undefined) {
              return "none"
            } else {
              return data.data.priceComponent.coinDiscountText.match(/\d+/g)[0];
            }
          };

          var price_fun = () => {
            if (data.data.priceComponent.discountPrice.minActivityAmount != undefined) {
              return data.data.priceComponent.discountPrice.minActivityAmount.value;
            } else {
              return data.data.priceComponent.origPrice.minAmount.value;
            }
          };
          
          var total = () => {
            if (data.data.priceComponent.coinDiscountText != undefined) {
                const total = parseFloat(price_fun()) - (parseFloat(price_fun()) * parseFloat(data.data.priceComponent.coinDiscountText.match(/\d+/g)[0])) / 100;
                return total.toFixed(2);
            } else {
              return parseFloat(price_fun());
            }
          };
          
          var shaped = {
            discountPrice: parseFloat(price_fun()),
            discount: parseFloat(discount()),
            total: parseFloat(total()),
          };
        
          result['points'] = shaped;
          break;
          case 2: // Super
          var price_fun = () => {
            if (data.data.priceComponent.discountPrice.minActivityAmount != undefined) {
              return data.data.priceComponent.discountPrice.minActivityAmount.value;
            } else {
              return data.data.priceComponent.origPrice.minAmount.value;
            }
          };
          
          var shaped = {
            price: price_fun(),
          };

          result['super'] = shaped;
          break;
          case 3: // Limited
          var price_fun = () => {
            if (data.data.priceComponent.discountPrice.minActivityAmount != undefined) {
              return data.data.priceComponent.discountPrice.minActivityAmount.value;
            } else {
              return data.data.priceComponent.origPrice.minAmount.value;
            }
          };
          
          var shaped = {
            price: price_fun(),
          };
          result['limited'] = shaped;
          break;
        }

      } else {
        res.json({ ok : false});
        console.error(`Unable to extract data from response ${index + 1}.`);
      }
      };
      
    });
    res.json(result);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(3000, () => {
  console.log(`App is on port : 3000`);
  keepAppRunning();
});