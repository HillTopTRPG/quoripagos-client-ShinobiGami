<template>
  <div id="the-play" :class="`battle-field-${battleField}`" :style="globalStyle">
    <flexible-data-layout :definition="layoutData" :barSetDelay="2700">
      <modal-area />
      <special-input-area @submit="onDiceCommand()" />
      <div class="cut-in-container">
        <youtube-player :video-id="'e1xCOsgWG0M'"/>
      </div>
      <div
        class="history-block"
        @click="onEndDiceRoll()"
        :style="{'--bottom': bottomHeight}"
        v-if="chatHistoryList.length"
        :class="[chatHistoryList[0]?.viewTextInfo.isMe ? 'image-left' : 'image-right']"
      >
        <div
          class="view-text first"
          @click="onEndDiceRoll()"
          :style="{...getChatStyle(chatHistoryList[0].viewTextInfo, 1), '--offset': 0, '--image': chatHistoryList[0].viewTextInfo?.standImage}"
          v-if="chatHistoryList[0].viewTextInfo"
        >
          <span class="from-label">{{ getFromLabel(chatHistoryList[0].viewTextInfo || null) }}</span>
          <template v-if="chatHistoryList[0].viewTextInfo?.secret === 'secret' && chatHistoryList[0].owner !== selfUserRef?.key">
            シークレットダイスロール
          </template>
          <span class="chat-text" v-else>{{ chatHistoryList[0].viewTextInfo?.text }}</span>
          <div
            class="dice-result"
            v-if="chatHistoryList[0].viewTextInfo?.secret !== 'secret' || chatHistoryList[0].owner === selfUserRef?.key"
          >
            <span v-if="chatHistoryList[0].viewTextInfo"></span>
            <span class="dice-roll-result" v-if="chatHistoryList[0].viewTextInfo?.diceRollResult">{{ chatHistoryList[0].viewTextInfo?.diceRollResult }}</span>
            <span>{{ chatHistoryList[0].viewTextInfo?.diceText }}</span>
          </div>
        </div>
        <div class="img" :style="{ '--image': chatHistoryList[0].viewTextInfo.standImage }" :class="!chatHistoryList[0].viewTextInfo.standImage ? 'non-image' : ''">
          <template v-if="chatHistoryList[0].viewTextInfo?.secret !== 'secret' || chatHistoryList[0].owner === selfUserRef.key">
            <div
              v-for="(pip, idx) in chatHistoryList[0].pips"
              :key="`${chatHistoryList[0].key}-${idx}`"
              class="dice-wrap roll"
              :class="`${pip[0]}-${pip[1]}`"
              :style="{...getChatStyle(chatHistoryList[0].viewTextInfo, 2), '--offset': idx, '--dice-count': chatHistoryList[0].pips.length}"
            >
              <div class="dice"></div>
            </div>
          </template>
        </div>
        <div class="history">
          <template v-for="(h, idx) in chatHistoryList" :key="h.key">
            <div
              class="view-text"
              :style="{...getChatStyle(h.viewTextInfo, 3), '--offset': idx, '--image': h.viewTextInfo?.standImage}"
              :class="[chatHistoryList[0].viewTextInfo.isMe ? 'image-left' : 'image-right', idx ? 'old' : 'first']"
              v-if="h.viewTextInfo && idx > 0"
            >
              <span class="from-label">{{ getFromLabel(h.viewTextInfo || null) }}</span>
              <template v-if="chatHistoryList[0].viewTextInfo?.secret === 'secret' && chatHistoryList[0].owner !== selfUserRef?.key">
                シークレットダイスロール
              </template>
              <span class="chat-text" v-else>{{ h.viewTextInfo?.text }}</span>
              <div
                class="dice-result"
                v-if="h.viewTextInfo?.secret !== 'secret' || chatHistoryList[0].owner === selfUserRef?.key"
              >
                <span class="dice-roll-result" v-if="h.viewTextInfo?.diceRollResult">{{ h.viewTextInfo?.diceRollResult }}</span>
                <span>{{ h.viewTextInfo?.diceText }}</span>
              </div>
            </div>
          </template>
        </div>
      </div>
      <template #left-box>
        <template v-if="!chatList.length">
          ここはチャット欄です。
        </template>
        <template v-else>
          <template v-for="c in chatList" :key="c.key">
            <div class="chat" :style="getChatStyle(c.data, 0)">
            <span class="from-label">
              <span>{{ getFromLabel(c.data || null) }}</span>
              <i18n-d
                tag="span"
                :value="new Date(c.createDateTime)"
                :format="getTimeFormat(c.createDateTime)"
              ></i18n-d>
            </span>
              <template v-if="c.data?.secret === 'secret' && c.owner !== selfUserRef?.key">
                シークレットダイスロール
              </template>
              <span v-else class="chat-text">
              {{ c.data?.raw }}
              <button @click="openSecretDiceRoll(c.key)" v-if="c.data?.secret === 'secret'">公開</button>
            </span>
              <template v-if="c.data?.secret === 'opened'">
                [公開済]
              </template>
            </div>
            <div
              class="chat dice-result"
              :style="getChatStyle(c.data, 0)"
              v-if="c.data?.diceRaw && (c.data?.secret !== 'secret' || c.owner === selfUserRef?.key)"
            >
              <span class="dice-roll-result" v-if="c.data?.diceRollResult">{{ c.data?.diceRollResult }}</span>
              {{ c.data?.diceRaw }}
            </div>
          </template>
        </template>
        <div class="chat-bottom" ref="chatBottomElm"></div>
      </template>
      <template #bottom-box>
        <div class="bottom-box-left">
          <select class="from-select" v-model="from">
            <option :value="selfUserRef?.key || ''">{{ selfUserRef?.name || '' }}</option>
            <option :value="n.key" v-for="n in targetCharacterList" :key="n.key">{{ n.name }}</option>
          </select>
          <button @click="onChangeMode('SG')">SGコマンド</button>
        </div>
        <textarea
          id="chat-input"
          v-model="chatInput"
          @keypress.enter.prevent="sendMessage($event, true)"
          @keyup.enter.prevent="sendMessage($event, false)"
          :placeholder="`チャット入力欄${isMobile ? '' : '（改行はShift + Enter）'}`"
        ></textarea>
        <button v-if="isMobile" @click="sendMessage($event)">送信</button>
      </template>
      <template #top-box>
        <scene-status-area />
      </template>
      <template #simple-center>
        <character-status-area />
      </template>
      <template #dramatic-scene>
        <dramatic-scene-area />
      </template>
      <template #velocity-system>
        <velocity-column />
      </template>
      <template #right-box>
        <template v-if="!pcList.length">{{
          'ハンドアウトがありません。\n画面左上のメニューアイコンから追加しましょう。'
        }}</template>
        <template v-for="d in pcList" :key="d._characterKey">
          <character-detail-view
            type="pc"
            :target="d._characterKey"
          />
        </template>
        <template v-for="d in npcList" :key="d._characterKey">
          <character-detail-view
            type="npc"
            :target="d._characterKey"
            v-if="isGm || !d.secretcheck"
          />
        </template>
        <template v-for="d in rightHandList" :key="d._characterKey">
          <character-detail-view
            type="right-hand"
            :target="d._characterKey"
            v-if="isGm || !d._secretCheck"
          />
        </template>
        <template v-for="d in enigmaList" :key="d.name">
          <character-detail-view
            type="enigma"
            :target="d.name"
          />
        </template>
      </template>
      <template #section-core>
        <div class="effect-container">
          <div class="effects">
            <div class="rain"><i style="left:693px;top:844px"></i><i style="left:1307px;top:-31px"></i><i style="left:984px;top:101px"></i><i style="left:1662px;top:-64px"></i><i style="left:999px;top:1371px"></i><i style="left:960px;top:-820px"></i><i style="left:1288px;top:185px"></i><i style="left:1618px;top:103px"></i><i style="left:659px;top:1180px"></i><i style="left:648px;top:-408px"></i><i style="left:844px;top:10px"></i><i style="left:662px;top:1098px"></i><i style="left:471px;top:55px"></i><i style="left:811px;top:-752px"></i><i style="left:281px;top:1300px"></i><i style="left:117px;top:153px"></i><i style="left:579px;top:942px"></i><i style="left:657px;top:-977px"></i><i style="left:1757px;top:808px"></i><i style="left:1334px;top:116px"></i><i style="left:1089px;top:-59px"></i><i style="left:615px;top:661px"></i><i style="left:1303px;top:-163px"></i><i style="left:60px;top:789px"></i><i style="left:1038px;top:-686px"></i><i style="left:920px;top:1190px"></i><i style="left:1174px;top:-21px"></i><i style="left:1031px;top:-762px"></i><i style="left:1541px;top:432px"></i><i style="left:72px;top:286px"></i><i style="left:1746px;top:34px"></i><i style="left:900px;top:566px"></i><i style="left:1045px;top:-666px"></i><i style="left:224px;top:-370px"></i><i style="left:206px;top:-904px"></i><i style="left:1586px;top:-521px"></i><i style="left:410px;top:-962px"></i><i style="left:223px;top:604px"></i><i style="left:457px;top:-558px"></i><i style="left:516px;top:163px"></i><i style="left:1474px;top:380px"></i><i style="left:1363px;top:748px"></i><i style="left:35px;top:1337px"></i><i style="left:1029px;top:263px"></i><i style="left:360px;top:443px"></i><i style="left:1343px;top:825px"></i><i style="left:1731px;top:1009px"></i><i style="left:1613px;top:442px"></i><i style="left:333px;top:-920px"></i><i style="left:1202px;top:-815px"></i><i style="left:1081px;top:126px"></i><i style="left:1820px;top:381px"></i><i style="left:1687px;top:-234px"></i><i style="left:1064px;top:1364px"></i><i style="left:1601px;top:518px"></i><i style="left:545px;top:105px"></i><i style="left:1198px;top:-508px"></i><i style="left:61px;top:658px"></i><i style="left:73px;top:1197px"></i><i style="left:774px;top:40px"></i><i style="left:1680px;top:483px"></i><i style="left:1742px;top:1118px"></i><i style="left:369px;top:-825px"></i><i style="left:307px;top:-557px"></i><i style="left:1641px;top:973px"></i><i style="left:1273px;top:1015px"></i><i style="left:1727px;top:1334px"></i><i style="left:1390px;top:-637px"></i><i style="left:1693px;top:1164px"></i><i style="left:1394px;top:-687px"></i><i style="left:363px;top:300px"></i><i style="left:492px;top:965px"></i><i style="left:1507px;top:212px"></i><i style="left:201px;top:878px"></i><i style="left:1047px;top:-646px"></i><i style="left:1796px;top:1045px"></i><i style="left:10px;top:1px"></i><i style="left:235px;top:155px"></i><i style="left:863px;top:1131px"></i><i style="left:1415px;top:802px"></i><i style="left:605px;top:1220px"></i><i style="left:1557px;top:484px"></i><i style="left:906px;top:563px"></i><i style="left:1087px;top:582px"></i><i style="left:14px;top:-726px"></i><i style="left:226px;top:-883px"></i><i style="left:311px;top:-215px"></i><i style="left:1401px;top:-679px"></i><i style="left:817px;top:1245px"></i><i style="left:1095px;top:992px"></i><i style="left:1092px;top:275px"></i><i style="left:1630px;top:49px"></i><i style="left:516px;top:-335px"></i><i style="left:238px;top:-675px"></i><i style="left:286px;top:690px"></i><i style="left:763px;top:496px"></i><i style="left:527px;top:667px"></i><i style="left:1626px;top:-142px"></i><i style="left:1691px;top:-71px"></i><i style="left:419px;top:-189px"></i><i style="left:758px;top:-455px"></i><i style="left:1618px;top:-910px"></i><i style="left:147px;top:335px"></i><i style="left:778px;top:317px"></i><i style="left:1296px;top:293px"></i><i style="left:1836px;top:494px"></i><i style="left:132px;top:7px"></i><i style="left:1586px;top:368px"></i><i style="left:538px;top:512px"></i><i style="left:702px;top:-701px"></i><i style="left:627px;top:-103px"></i><i style="left:303px;top:1345px"></i><i style="left:1090px;top:752px"></i><i style="left:1502px;top:23px"></i><i style="left:1763px;top:-670px"></i><i style="left:1467px;top:136px"></i><i style="left:1708px;top:-138px"></i><i style="left:1228px;top:-112px"></i><i style="left:310px;top:1361px"></i><i style="left:917px;top:852px"></i><i style="left:195px;top:281px"></i><i style="left:835px;top:470px"></i><i style="left:1025px;top:-67px"></i><i style="left:1705px;top:954px"></i><i style="left:996px;top:486px"></i><i style="left:598px;top:-280px"></i><i style="left:1822px;top:-799px"></i><i style="left:152px;top:444px"></i><i style="left:673px;top:-395px"></i><i style="left:1834px;top:470px"></i><i style="left:995px;top:5px"></i><i style="left:992px;top:-814px"></i><i style="left:588px;top:-38px"></i><i style="left:1179px;top:-949px"></i><i style="left:341px;top:1180px"></i><i style="left:1556px;top:-268px"></i><i style="left:730px;top:1203px"></i><i style="left:1439px;top:878px"></i><i style="left:723px;top:-718px"></i><i style="left:1367px;top:387px"></i><i style="left:587px;top:487px"></i><i style="left:504px;top:806px"></i><i style="left:623px;top:-933px"></i><i style="left:52px;top:319px"></i><i style="left:1107px;top:362px"></i><i style="left:1300px;top:1059px"></i><i style="left:89px;top:744px"></i><i style="left:1136px;top:1206px"></i><i style="left:1259px;top:-229px"></i><i style="left:725px;top:969px"></i><i style="left:833px;top:919px"></i><i style="left:1177px;top:-114px"></i><i style="left:484px;top:-675px"></i><i style="left:942px;top:995px"></i><i style="left:1824px;top:18px"></i><i style="left:496px;top:765px"></i><i style="left:34px;top:-358px"></i><i style="left:1154px;top:437px"></i><i style="left:1128px;top:-19px"></i><i style="left:413px;top:-770px"></i><i style="left:961px;top:-76px"></i><i style="left:870px;top:-627px"></i><i style="left:976px;top:918px"></i><i style="left:381px;top:526px"></i><i style="left:1605px;top:-350px"></i><i style="left:1791px;top:1188px"></i><i style="left:539px;top:-692px"></i><i style="left:1408px;top:-352px"></i><i style="left:1117px;top:-924px"></i><i style="left:1825px;top:1103px"></i><i style="left:439px;top:-140px"></i><i style="left:1588px;top:-133px"></i><i style="left:1375px;top:376px"></i><i style="left:1832px;top:-471px"></i><i style="left:1506px;top:479px"></i><i style="left:521px;top:92px"></i><i style="left:1498px;top:569px"></i><i style="left:265px;top:-711px"></i><i style="left:1740px;top:801px"></i><i style="left:553px;top:828px"></i><i style="left:1596px;top:-150px"></i><i style="left:784px;top:-52px"></i><i style="left:444px;top:-665px"></i><i style="left:773px;top:1246px"></i><i style="left:538px;top:-611px"></i><i style="left:735px;top:382px"></i><i style="left:1756px;top:1249px"></i><i style="left:1643px;top:-795px"></i><i style="left:777px;top:35px"></i><i style="left:1554px;top:1155px"></i><i style="left:1476px;top:654px"></i><i style="left:1849px;top:548px"></i><i style="left:1314px;top:-308px"></i><i style="left:273px;top:707px"></i><i style="left:1875px;top:457px"></i><i style="left:908px;top:738px"></i><i style="left:624px;top:-233px"></i><i style="left:895px;top:-447px"></i><i style="left:67px;top:746px"></i><i style="left:1459px;top:-458px"></i><i style="left:993px;top:6px"></i><i style="left:1660px;top:1260px"></i><i style="left:724px;top:702px"></i><i style="left:1394px;top:1342px"></i><i style="left:312px;top:-22px"></i><i style="left:395px;top:1341px"></i><i style="left:642px;top:-680px"></i><i style="left:823px;top:513px"></i><i style="left:1522px;top:1314px"></i><i style="left:1372px;top:-293px"></i><i style="left:1888px;top:-866px"></i><i style="left:1895px;top:-792px"></i><i style="left:1808px;top:394px"></i><i style="left:769px;top:183px"></i><i style="left:1812px;top:1138px"></i><i style="left:1341px;top:-769px"></i><i style="left:1085px;top:1347px"></i><i style="left:1298px;top:510px"></i><i style="left:1174px;top:1306px"></i><i style="left:917px;top:577px"></i><i style="left:433px;top:-654px"></i><i style="left:1805px;top:1382px"></i><i style="left:1006px;top:470px"></i><i style="left:1362px;top:558px"></i><i style="left:894px;top:-267px"></i><i style="left:1641px;top:-803px"></i><i style="left:205px;top:1133px"></i><i style="left:155px;top:1199px"></i><i style="left:1078px;top:-626px"></i><i style="left:75px;top:17px"></i><i style="left:1248px;top:675px"></i><i style="left:447px;top:-283px"></i><i style="left:1594px;top:-801px"></i><i style="left:48px;top:246px"></i><i style="left:738px;top:-592px"></i><i style="left:545px;top:312px"></i><i style="left:1523px;top:1255px"></i><i style="left:1451px;top:648px"></i><i style="left:463px;top:-202px"></i><i style="left:1285px;top:-840px"></i><i style="left:349px;top:-537px"></i><i style="left:871px;top:328px"></i><i style="left:1880px;top:-165px"></i><i style="left:341px;top:-30px"></i><i style="left:170px;top:-567px"></i><i style="left:1175px;top:884px"></i><i style="left:1815px;top:-521px"></i><i style="left:499px;top:576px"></i><i style="left:1237px;top:-169px"></i><i style="left:1324px;top:420px"></i><i style="left:1758px;top:1141px"></i><i style="left:1405px;top:666px"></i><i style="left:764px;top:-453px"></i><i style="left:560px;top:1299px"></i><i style="left:1808px;top:797px"></i><i style="left:1313px;top:-539px"></i><i style="left:608px;top:-862px"></i><i style="left:1254px;top:797px"></i><i style="left:32px;top:148px"></i><i style="left:109px;top:-82px"></i><i style="left:1357px;top:-678px"></i><i style="left:1516px;top:-543px"></i><i style="left:1035px;top:-737px"></i><i style="left:1487px;top:-877px"></i><i style="left:1653px;top:1312px"></i><i style="left:1643px;top:-617px"></i><i style="left:783px;top:462px"></i><i style="left:1493px;top:944px"></i><i style="left:387px;top:-710px"></i><i style="left:1383px;top:58px"></i><i style="left:690px;top:1345px"></i><i style="left:897px;top:273px"></i><i style="left:102px;top:788px"></i><i style="left:958px;top:-942px"></i><i style="left:1531px;top:414px"></i><i style="left:644px;top:46px"></i><i style="left:1488px;top:-573px"></i><i style="left:1577px;top:1187px"></i><i style="left:51px;top:132px"></i><i style="left:689px;top:1284px"></i><i style="left:179px;top:120px"></i><i style="left:704px;top:-339px"></i><i style="left:572px;top:940px"></i><i style="left:161px;top:594px"></i><i style="left:1107px;top:1214px"></i><i style="left:420px;top:-441px"></i><i style="left:1254px;top:-838px"></i><i style="left:415px;top:42px"></i><i style="left:1841px;top:-986px"></i><i style="left:694px;top:-631px"></i><i style="left:1747px;top:801px"></i><i style="left:174px;top:-276px"></i><i style="left:1772px;top:370px"></i><i style="left:1345px;top:1281px"></i><i style="left:206px;top:-169px"></i><i style="left:708px;top:776px"></i><i style="left:582px;top:749px"></i><i style="left:1268px;top:607px"></i><i style="left:976px;top:223px"></i><i style="left:665px;top:1049px"></i><i style="left:57px;top:-29px"></i><i style="left:1275px;top:-516px"></i><i style="left:140px;top:559px"></i><i style="left:326px;top:988px"></i><i style="left:1848px;top:-398px"></i><i style="left:1577px;top:794px"></i><i style="left:664px;top:-590px"></i><i style="left:400px;top:1039px"></i><i style="left:1697px;top:624px"></i><i style="left:1536px;top:1165px"></i><i style="left:745px;top:-995px"></i><i style="left:1281px;top:786px"></i><i style="left:1491px;top:-327px"></i><i style="left:1468px;top:1128px"></i><i style="left:823px;top:796px"></i><i style="left:42px;top:-85px"></i><i style="left:1239px;top:-543px"></i><i style="left:731px;top:130px"></i><i style="left:1626px;top:1205px"></i><i style="left:872px;top:296px"></i><i style="left:210px;top:-280px"></i><i style="left:865px;top:490px"></i><i style="left:1348px;top:967px"></i><i style="left:663px;top:25px"></i><i style="left:472px;top:1037px"></i><i style="left:203px;top:-150px"></i><i style="left:1113px;top:309px"></i><i style="left:280px;top:977px"></i><i style="left:1571px;top:1361px"></i><i style="left:1709px;top:-512px"></i><i style="left:973px;top:1128px"></i><i style="left:1425px;top:628px"></i><i style="left:803px;top:-664px"></i><i style="left:189px;top:554px"></i><i style="left:1840px;top:1232px"></i><i style="left:1317px;top:-488px"></i><i style="left:776px;top:-249px"></i><i style="left:633px;top:-815px"></i><i style="left:151px;top:943px"></i><i style="left:1009px;top:-58px"></i><i style="left:1126px;top:1120px"></i><i style="left:404px;top:-963px"></i><i style="left:1799px;top:173px"></i><i style="left:1345px;top:-656px"></i><i style="left:101px;top:-606px"></i><i style="left:1638px;top:-976px"></i><i style="left:404px;top:-111px"></i><i style="left:1437px;top:-903px"></i><i style="left:192px;top:-421px"></i><i style="left:1859px;top:-846px"></i><i style="left:1698px;top:-563px"></i><i style="left:1645px;top:1175px"></i><i style="left:771px;top:-481px"></i><i style="left:1046px;top:472px"></i><i style="left:1683px;top:206px"></i><i style="left:1093px;top:1214px"></i><i style="left:625px;top:-260px"></i><i style="left:1297px;top:240px"></i><i style="left:383px;top:153px"></i><i style="left:1842px;top:-933px"></i><i style="left:773px;top:1272px"></i><i style="left:1576px;top:-48px"></i><i style="left:479px;top:57px"></i><i style="left:1101px;top:-870px"></i><i style="left:1308px;top:-814px"></i><i style="left:658px;top:-299px"></i><i style="left:1591px;top:-231px"></i><i style="left:897px;top:15px"></i><i style="left:435px;top:200px"></i><i style="left:1380px;top:-809px"></i><i style="left:417px;top:134px"></i><i style="left:1459px;top:-127px"></i><i style="left:715px;top:979px"></i><i style="left:1565px;top:-918px"></i><i style="left:189px;top:333px"></i><i style="left:1417px;top:822px"></i><i style="left:1413px;top:-59px"></i><i style="left:1315px;top:-715px"></i><i style="left:1248px;top:-597px"></i><i style="left:1812px;top:588px"></i><i style="left:1164px;top:704px"></i><i style="left:172px;top:545px"></i><i style="left:789px;top:-891px"></i><i style="left:1257px;top:1397px"></i><i style="left:894px;top:158px"></i><i style="left:323px;top:775px"></i><i style="left:1498px;top:-378px"></i><i style="left:1849px;top:1201px"></i><i style="left:209px;top:1295px"></i><i style="left:768px;top:-446px"></i><i style="left:1070px;top:1070px"></i><i style="left:534px;top:1221px"></i><i style="left:466px;top:31px"></i><i style="left:1518px;top:508px"></i><i style="left:660px;top:-405px"></i><i style="left:1266px;top:701px"></i><i style="left:1019px;top:-989px"></i><i style="left:1837px;top:-843px"></i><i style="left:459px;top:-107px"></i><i style="left:957px;top:1032px"></i><i style="left:386px;top:286px"></i><i style="left:163px;top:-267px"></i><i style="left:606px;top:820px"></i><i style="left:103px;top:-474px"></i><i style="left:1680px;top:662px"></i><i style="left:1232px;top:-980px"></i><i style="left:1886px;top:291px"></i><i style="left:612px;top:1029px"></i><i style="left:362px;top:-625px"></i><i style="left:1191px;top:1199px"></i><i style="left:1230px;top:-306px"></i><i style="left:1093px;top:428px"></i><i style="left:1566px;top:-370px"></i><i style="left:1629px;top:-912px"></i><i style="left:786px;top:-767px"></i><i style="left:4px;top:1313px"></i><i style="left:1096px;top:553px"></i><i style="left:1619px;top:242px"></i><i style="left:1392px;top:70px"></i><i style="left:981px;top:615px"></i><i style="left:1243px;top:685px"></i><i style="left:1031px;top:1126px"></i><i style="left:719px;top:1192px"></i><i style="left:1464px;top:-167px"></i><i style="left:128px;top:974px"></i><i style="left:1px;top:122px"></i><i style="left:786px;top:-390px"></i><i style="left:354px;top:1288px"></i><i style="left:221px;top:300px"></i><i style="left:857px;top:-240px"></i><i style="left:319px;top:-840px"></i><i style="left:1817px;top:344px"></i><i style="left:1587px;top:-628px"></i><i style="left:1282px;top:894px"></i><i style="left:1265px;top:1323px"></i><i style="left:780px;top:780px"></i><i style="left:672px;top:-653px"></i><i style="left:44px;top:-423px"></i><i style="left:820px;top:-106px"></i><i style="left:262px;top:-903px"></i><i style="left:897px;top:-416px"></i><i style="left:805px;top:95px"></i><i style="left:1041px;top:-734px"></i><i style="left:1581px;top:-677px"></i><i style="left:1287px;top:-344px"></i><i style="left:68px;top:465px"></i><i style="left:1550px;top:-721px"></i><i style="left:1232px;top:459px"></i><i style="left:492px;top:-555px"></i><i style="left:409px;top:215px"></i><i style="left:1621px;top:-197px"></i><i style="left:757px;top:1154px"></i><i style="left:1147px;top:28px"></i><i style="left:1501px;top:-658px"></i><i style="left:1357px;top:-35px"></i><i style="left:571px;top:944px"></i><i style="left:1667px;top:788px"></i><i style="left:191px;top:1003px"></i><i style="left:101px;top:1051px"></i><i style="left:1209px;top:-287px"></i><i style="left:1057px;top:1323px"></i><i style="left:1289px;top:-525px"></i><i style="left:359px;top:1068px"></i><i style="left:1049px;top:-225px"></i><i style="left:1832px;top:245px"></i><i style="left:674px;top:-164px"></i><i style="left:1250px;top:-499px"></i><i style="left:119px;top:984px"></i><i style="left:1787px;top:494px"></i><i style="left:1544px;top:57px"></i><i style="left:1464px;top:-676px"></i><i style="left:104px;top:-688px"></i><i style="left:1510px;top:172px"></i><i style="left:986px;top:1075px"></i><i style="left:419px;top:1355px"></i><i style="left:1039px;top:927px"></i><i style="left:1760px;top:1167px"></i><i style="left:377px;top:906px"></i><i style="left:1107px;top:1169px"></i><i style="left:1844px;top:745px"></i><i style="left:725px;top:-172px"></i><i style="left:553px;top:-95px"></i><i style="left:695px;top:699px"></i><i style="left:69px;top:1096px"></i><i style="left:1330px;top:213px"></i><i style="left:647px;top:-650px"></i><i style="left:106px;top:313px"></i><i style="left:1813px;top:-868px"></i><i style="left:1329px;top:450px"></i><i style="left:1719px;top:-827px"></i><i style="left:16px;top:-901px"></i><i style="left:1848px;top:1259px"></i><i style="left:810px;top:1205px"></i><i style="left:231px;top:-935px"></i><i style="left:1392px;top:-90px"></i><i style="left:1685px;top:85px"></i><i style="left:786px;top:732px"></i><i style="left:1627px;top:-404px"></i><i style="left:1413px;top:-681px"></i><i style="left:1417px;top:880px"></i><i style="left:718px;top:1366px"></i><i style="left:302px;top:35px"></i><i style="left:373px;top:-387px"></i><i style="left:867px;top:-509px"></i><i style="left:1617px;top:602px"></i><i style="left:1445px;top:370px"></i><i style="left:1675px;top:-529px"></i><i style="left:1489px;top:952px"></i><i style="left:158px;top:150px"></i><i style="left:1689px;top:1177px"></i><i style="left:1600px;top:884px"></i><i style="left:757px;top:88px"></i><i style="left:471px;top:98px"></i><i style="left:1049px;top:384px"></i><i style="left:1508px;top:1241px"></i><i style="left:1865px;top:-209px"></i><i style="left:1810px;top:1355px"></i><i style="left:1826px;top:102px"></i><i style="left:1600px;top:-574px"></i><i style="left:33px;top:1223px"></i><i style="left:1221px;top:-571px"></i><i style="left:1252px;top:-420px"></i><i style="left:582px;top:1172px"></i><i style="left:723px;top:909px"></i><i style="left:1483px;top:-497px"></i><i style="left:1811px;top:-305px"></i><i style="left:987px;top:1077px"></i><i style="left:1315px;top:296px"></i><i style="left:982px;top:533px"></i><i style="left:348px;top:-326px"></i><i style="left:742px;top:851px"></i><i style="left:1103px;top:-59px"></i><i style="left:1533px;top:-683px"></i><i style="left:614px;top:292px"></i><i style="left:498px;top:223px"></i><i style="left:175px;top:-836px"></i><i style="left:857px;top:1364px"></i><i style="left:1479px;top:-761px"></i><i style="left:372px;top:-549px"></i><i style="left:1440px;top:927px"></i><i style="left:203px;top:-718px"></i><i style="left:509px;top:-492px"></i><i style="left:1080px;top:-446px"></i><i style="left:611px;top:616px"></i><i style="left:1578px;top:-142px"></i><i style="left:60px;top:186px"></i><i style="left:1348px;top:-535px"></i><i style="left:1815px;top:-262px"></i><i style="left:559px;top:-878px"></i><i style="left:354px;top:1224px"></i><i style="left:47px;top:410px"></i><i style="left:1263px;top:1336px"></i><i style="left:1255px;top:343px"></i><i style="left:1212px;top:467px"></i><i style="left:259px;top:-975px"></i><i style="left:315px;top:376px"></i><i style="left:99px;top:507px"></i><i style="left:880px;top:604px"></i><i style="left:1124px;top:-59px"></i><i style="left:485px;top:-671px"></i><i style="left:408px;top:-403px"></i><i style="left:1307px;top:-508px"></i><i style="left:1171px;top:-894px"></i><i style="left:218px;top:-169px"></i><i style="left:194px;top:823px"></i><i style="left:207px;top:-623px"></i><i style="left:671px;top:263px"></i><i style="left:1169px;top:670px"></i><i style="left:878px;top:-405px"></i><i style="left:922px;top:343px"></i><i style="left:652px;top:141px"></i><i style="left:941px;top:612px"></i><i style="left:1425px;top:80px"></i><i style="left:82px;top:338px"></i><i style="left:308px;top:-815px"></i><i style="left:281px;top:519px"></i><i style="left:1039px;top:590px"></i><i style="left:688px;top:63px"></i><i style="left:1456px;top:-543px"></i><i style="left:272px;top:-520px"></i><i style="left:375px;top:188px"></i><i style="left:1350px;top:-609px"></i><i style="left:300px;top:1303px"></i><i style="left:918px;top:375px"></i><i style="left:1900px;top:456px"></i><i style="left:1788px;top:-815px"></i><i style="left:720px;top:-570px"></i><i style="left:1558px;top:1201px"></i><i style="left:1585px;top:1303px"></i><i style="left:1471px;top:787px"></i><i style="left:1520px;top:-270px"></i><i style="left:603px;top:1364px"></i><i style="left:1685px;top:257px"></i><i style="left:425px;top:-590px"></i><i style="left:1656px;top:1107px"></i><i style="left:229px;top:439px"></i><i style="left:1626px;top:-832px"></i><i style="left:1175px;top:1151px"></i><i style="left:1510px;top:542px"></i><i style="left:1415px;top:776px"></i><i style="left:37px;top:255px"></i><i style="left:573px;top:1026px"></i><i style="left:605px;top:-801px"></i><i style="left:464px;top:-498px"></i><i style="left:1175px;top:769px"></i><i style="left:1104px;top:-98px"></i><i style="left:391px;top:-240px"></i><i style="left:673px;top:1308px"></i><i style="left:1487px;top:773px"></i><i style="left:1775px;top:148px"></i><i style="left:15px;top:1394px"></i><i style="left:145px;top:-844px"></i><i style="left:1225px;top:420px"></i><i style="left:511px;top:794px"></i><i style="left:1580px;top:-345px"></i><i style="left:1156px;top:367px"></i><i style="left:346px;top:15px"></i><i style="left:178px;top:19px"></i><i style="left:1728px;top:298px"></i><i style="left:906px;top:1245px"></i><i style="left:346px;top:-626px"></i><i style="left:540px;top:-712px"></i><i style="left:1477px;top:-64px"></i><i style="left:1442px;top:-230px"></i><i style="left:1051px;top:-656px"></i><i style="left:95px;top:-834px"></i><i style="left:1860px;top:16px"></i><i style="left:869px;top:283px"></i><i style="left:819px;top:-493px"></i><i style="left:1799px;top:-121px"></i><i style="left:1335px;top:130px"></i><i style="left:830px;top:98px"></i><i style="left:1161px;top:941px"></i><i style="left:1418px;top:-572px"></i><i style="left:1617px;top:-359px"></i><i style="left:708px;top:-833px"></i><i style="left:521px;top:793px"></i><i style="left:1173px;top:-362px"></i><i style="left:1561px;top:669px"></i><i style="left:1162px;top:366px"></i><i style="left:1616px;top:950px"></i><i style="left:294px;top:1325px"></i><i style="left:161px;top:-110px"></i><i style="left:1476px;top:745px"></i><i style="left:298px;top:528px"></i><i style="left:33px;top:-162px"></i><i style="left:1452px;top:-92px"></i><i style="left:496px;top:-139px"></i><i style="left:1309px;top:-116px"></i><i style="left:684px;top:40px"></i><i style="left:1141px;top:938px"></i><i style="left:1219px;top:-465px"></i><i style="left:722px;top:914px"></i><i style="left:448px;top:-548px"></i><i style="left:276px;top:-227px"></i><i style="left:1612px;top:337px"></i><i style="left:1472px;top:-80px"></i><i style="left:1453px;top:1317px"></i><i style="left:1099px;top:1283px"></i><i style="left:418px;top:307px"></i><i style="left:985px;top:479px"></i><i style="left:1214px;top:-249px"></i><i style="left:1369px;top:-417px"></i><i style="left:49px;top:396px"></i><i style="left:1597px;top:-861px"></i><i style="left:1751px;top:1253px"></i><i style="left:1705px;top:752px"></i><i style="left:366px;top:1189px"></i><i style="left:488px;top:-538px"></i><i style="left:1145px;top:-850px"></i><i style="left:349px;top:1094px"></i><i style="left:339px;top:-595px"></i><i style="left:1494px;top:111px"></i><i style="left:1443px;top:-548px"></i><i style="left:556px;top:-486px"></i><i style="left:684px;top:38px"></i><i style="left:1818px;top:398px"></i><i style="left:1783px;top:-468px"></i><i style="left:1564px;top:349px"></i><i style="left:1482px;top:-730px"></i><i style="left:1423px;top:-288px"></i><i style="left:786px;top:-932px"></i><i style="left:709px;top:-848px"></i><i style="left:1496px;top:395px"></i><i style="left:1138px;top:590px"></i><i style="left:1345px;top:1231px"></i><i style="left:1722px;top:-890px"></i><i style="left:1765px;top:805px"></i><i style="left:498px;top:122px"></i><i style="left:280px;top:-310px"></i><i style="left:477px;top:1088px"></i><i style="left:472px;top:376px"></i><i style="left:409px;top:216px"></i><i style="left:244px;top:-193px"></i><i style="left:1019px;top:-650px"></i><i style="left:392px;top:148px"></i><i style="left:1093px;top:-913px"></i><i style="left:571px;top:571px"></i><i style="left:1890px;top:1017px"></i><i style="left:1510px;top:955px"></i><i style="left:437px;top:-292px"></i><i style="left:1476px;top:546px"></i><i style="left:190px;top:475px"></i><i style="left:1795px;top:874px"></i><i style="left:417px;top:100px"></i><i style="left:858px;top:-115px"></i><i style="left:242px;top:162px"></i><i style="left:325px;top:975px"></i><i style="left:742px;top:-844px"></i><i style="left:1568px;top:479px"></i><i style="left:1433px;top:-565px"></i><i style="left:1509px;top:963px"></i><i style="left:1598px;top:5px"></i><i style="left:216px;top:361px"></i><i style="left:1171px;top:-665px"></i><i style="left:489px;top:1379px"></i><i style="left:730px;top:1353px"></i><i style="left:871px;top:-793px"></i><i style="left:1210px;top:1010px"></i><i style="left:340px;top:1123px"></i><i style="left:26px;top:411px"></i><i style="left:1094px;top:-466px"></i><i style="left:235px;top:1055px"></i><i style="left:1141px;top:776px"></i><i style="left:502px;top:-46px"></i><i style="left:414px;top:958px"></i><i style="left:1181px;top:-527px"></i><i style="left:1036px;top:606px"></i><i style="left:85px;top:105px"></i><i style="left:1205px;top:1236px"></i><i style="left:1374px;top:487px"></i><i style="left:1799px;top:385px"></i><i style="left:639px;top:644px"></i><i style="left:754px;top:946px"></i><i style="left:564px;top:647px"></i><i style="left:681px;top:1226px"></i><i style="left:919px;top:1273px"></i><i style="left:1505px;top:95px"></i><i style="left:1437px;top:1205px"></i><i style="left:23px;top:-341px"></i><i style="left:537px;top:697px"></i><i style="left:1345px;top:1371px"></i><i style="left:649px;top:1343px"></i><i style="left:1474px;top:-725px"></i><i style="left:1464px;top:962px"></i><i style="left:205px;top:1154px"></i><i style="left:1496px;top:-83px"></i><i style="left:304px;top:-787px"></i><i style="left:1577px;top:1245px"></i><i style="left:253px;top:1124px"></i><i style="left:735px;top:473px"></i><i style="left:804px;top:-929px"></i><i style="left:1516px;top:-924px"></i><i style="left:1858px;top:-134px"></i><i style="left:540px;top:-803px"></i><i style="left:243px;top:-684px"></i><i style="left:1022px;top:-658px"></i><i style="left:1600px;top:-111px"></i><i style="left:878px;top:600px"></i><i style="left:440px;top:-211px"></i><i style="left:969px;top:-428px"></i><i style="left:1665px;top:-221px"></i><i style="left:948px;top:-728px"></i><i style="left:1230px;top:66px"></i><i style="left:903px;top:1357px"></i><i style="left:1136px;top:1240px"></i><i style="left:27px;top:866px"></i><i style="left:285px;top:-751px"></i><i style="left:1843px;top:78px"></i><i style="left:933px;top:1358px"></i><i style="left:887px;top:-813px"></i><i style="left:1326px;top:717px"></i><i style="left:491px;top:-281px"></i><i style="left:1888px;top:863px"></i><i style="left:1464px;top:1371px"></i><i style="left:1287px;top:-217px"></i><i style="left:1570px;top:-975px"></i><i style="left:1098px;top:749px"></i><i style="left:210px;top:-48px"></i><i style="left:1454px;top:911px"></i><i style="left:1819px;top:736px"></i><i style="left:143px;top:683px"></i><i style="left:689px;top:406px"></i><i style="left:827px;top:-861px"></i><i style="left:1654px;top:-553px"></i><i style="left:651px;top:670px"></i><i style="left:1402px;top:871px"></i><i style="left:1082px;top:887px"></i><i style="left:888px;top:1380px"></i><i style="left:145px;top:1397px"></i><i style="left:154px;top:137px"></i><i style="left:558px;top:689px"></i><i style="left:742px;top:162px"></i><i style="left:1884px;top:461px"></i><i style="left:739px;top:-244px"></i><i style="left:1060px;top:875px"></i><i style="left:1359px;top:-458px"></i><i style="left:1241px;top:1199px"></i><i style="left:623px;top:-272px"></i><i style="left:1890px;top:-960px"></i><i style="left:1471px;top:-72px"></i><i style="left:537px;top:346px"></i><i style="left:476px;top:-127px"></i><i style="left:494px;top:1218px"></i><i style="left:1112px;top:-977px"></i><i style="left:80px;top:-546px"></i><i style="left:1571px;top:1378px"></i><i style="left:764px;top:75px"></i><i style="left:505px;top:876px"></i><i style="left:810px;top:412px"></i><i style="left:18px;top:350px"></i><i style="left:925px;top:-157px"></i><i style="left:715px;top:269px"></i><i style="left:1656px;top:1165px"></i><i style="left:1397px;top:261px"></i><i style="left:1247px;top:970px"></i><i style="left:163px;top:1095px"></i><i style="left:880px;top:-215px"></i><i style="left:1185px;top:717px"></i><i style="left:1255px;top:371px"></i><i style="left:1763px;top:-873px"></i><i style="left:893px;top:-131px"></i><i style="left:3px;top:321px"></i><i style="left:315px;top:676px"></i><i style="left:1572px;top:1013px"></i><i style="left:1177px;top:891px"></i><i style="left:975px;top:1181px"></i><i style="left:705px;top:40px"></i><i style="left:1605px;top:-865px"></i><i style="left:1180px;top:581px"></i><i style="left:278px;top:-201px"></i><i style="left:529px;top:447px"></i><i style="left:777px;top:461px"></i><i style="left:215px;top:1351px"></i><i style="left:1530px;top:630px"></i><i style="left:1874px;top:552px"></i><i style="left:500px;top:557px"></i><i style="left:1550px;top:1231px"></i><i style="left:1459px;top:1134px"></i><i style="left:1249px;top:372px"></i><i style="left:847px;top:876px"></i><i style="left:407px;top:746px"></i><i style="left:46px;top:-448px"></i><i style="left:1420px;top:917px"></i><i style="left:1304px;top:-794px"></i><i style="left:5px;top:267px"></i><i style="left:1414px;top:53px"></i><i style="left:837px;top:-108px"></i><i style="left:1799px;top:85px"></i><i style="left:904px;top:45px"></i><i style="left:371px;top:-250px"></i><i style="left:543px;top:-11px"></i><i style="left:131px;top:304px"></i><i style="left:1369px;top:223px"></i><i style="left:1045px;top:-889px"></i><i style="left:80px;top:-66px"></i><i style="left:904px;top:732px"></i></div>
            <div class="bubbles" v-for="n of 3" :key="n" :class="`sec${n}`"><div class="bubble" v-for="n of 6" :key="n" :class="`b${n}`"></div></div>
            <ul class="circles"><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li></ul>
            <div class="flames"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>
          </div>
        </div>
      </template>
    </flexible-data-layout>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, reactive, ref, watch } from 'vue'
import CharacterStore from '@/feature/character/data'
import MediaListStore from '@/feature/media-list/data'
import SceneStore from '@/feature/scene/data'
import ChatListStore, { BcdiceDiceRollResult, ChatStore } from '@/feature/chat-list/data'
import UserSettingStore from '@/feature/user-setting/data'
import UserStore from '@/core/data/user'
import ScenarioStore from '@/feature/scenario/data'
import { getBlock, SlotUnionInfo } from '@/core/flexible-data-layout.vue'
import VelocityColumn from '@/components/the-play/velocity-column.vue'
import CharacterStatusArea from '@/components/the-play/area/character-status-area.vue'
import ModalArea from '@/components/the-play/modal-area.vue'
import CharacterDetailView from '@/components/the-play/character-detail-view.vue'
import DramaticSceneArea from '@/components/the-play/area/dramatic-scene-area.vue'
import SceneStatusArea from '@/components/the-play/area/scene-status-area.vue'
import SpecialInputArea from '@/components/the-play/special-input-area.vue'
import SpecialInputStore from '@/feature/special-input/data'
import RoomSettingStore from '@/feature/room-setting/data'
import YoutubePlayer from '@/components/the-play/area/youtube-player.vue'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const layoutData = require('./the-play.yaml')

export default defineComponent({
  components: { YoutubePlayer, SpecialInputArea, SceneStatusArea, DramaticSceneArea, CharacterDetailView, ModalArea, CharacterStatusArea, VelocityColumn },
  setup() {
    const characterState = CharacterStore.injector()
    const mediaListState = MediaListStore.injector()
    const specialInputState = SpecialInputStore.injector()
    const chatBottomElm = ref<HTMLElement | null>(null)
    const userSettingState = UserSettingStore.injector()
    const chatListState = ChatListStore.injector()
    const sceneState = SceneStore.injector()
    const userState = UserStore.injector()
    const scenarioState = ScenarioStore.injector()
    const roomSettingState = RoomSettingStore.injector()
    const characterList = computed(() => characterState.characterList)
    const selfUserRef = computed(() => userState.selfUser || null)
    const targetCharacterList = ref<{ name: string, key: string | null }[]>([])
    const isGm = computed(() => userState.selfUser?.type === 'gm')
    watch(() => characterState.characterList, () => {
      targetCharacterList.value = scenarioState.getSelfList()
    }, { deep: true, immediate: true })

    const pcList = computed(() => scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.pc)
    const npcList = computed(() => scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.npc)
    const rightHandList = computed(() => scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.righthand)
    const enigmaList = computed(() => scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.enigma)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const globalStyle = reactive<any>({})
    watch(() => userSettingState.userSetting, () => {
      const a = userSettingState.userSetting
      globalStyle['--accent1-color'] = a?.accent1Color || globalStyle['--accent1-color']
      globalStyle['--accent2-color'] = a?.accent2Color || globalStyle['--accent2-color']
      globalStyle['--font-color'] = a?.fontColor || globalStyle['--font-color']
      globalStyle['--sheet-font-size'] = a?.sheetFontSize ? a?.sheetFontSize + 'px' : '' || globalStyle['--sheet-font-size']
    }, { deep: true, immediate: true })
    watch(() => sceneState.currentScene, () => {
      const bgImageUrl = mediaListState.list.find(n => n.key === sceneState?.currentScene?.backgroundImage)?.data?.url
      globalStyle['--background-image'] = bgImageUrl ? `url('${bgImageUrl}')` : ''
    }, { deep: true, immediate: true })

    const reactiveLayout = reactive<SlotUnionInfo>(layoutData)
    const bottomBox = reactive(getBlock(layoutData as SlotUnionInfo, 'bottom-box') || { minHeight: null })
    const bottomHeight = computed(() => `${(bottomBox?.minHeight?.px || 0) + 10}px`)

    const chatInput = ref('')

    const getDiceRollResultText = (bcdiceResultText: string | null | undefined): string | null => {
      let raw = bcdiceResultText || ''
      const idx1 = raw.indexOf('→')
      if (idx1 > -1) {
        const idx2 = raw.indexOf('→', idx1 + 1)
        if (idx2 > -1) {
          raw = raw.substring(idx1 + 1, idx2).trim()
        }
      }
      return raw || null
    }

    const diceRollAndChat = async (cmd: string, fromKey: string): Promise<{ insertChat: () => Promise<void>; bcdiceResult: BcdiceDiceRollResult | null }> => {
      let bcdiceResult: BcdiceDiceRollResult | null = null
      try {
        bcdiceResult = await chatListState.diceRoll(cmd)
      } catch (_) { /**/ }
      let diceResult = '結果'
      if (bcdiceResult?.critical) diceResult = 'スペシャル'
      else if (bcdiceResult?.success) diceResult = '成功'
      if (bcdiceResult?.fumble) diceResult = 'ファンブル'
      else if (bcdiceResult?.failure) diceResult = '失敗'
      return {
        bcdiceResult,
        insertChat: async () => {
          let fromType: 'user' | 'pc' | 'npc' | 'right-hand' | null = null
          if (fromKey === selfUserRef.value?.key) fromType = 'user'
          if (!fromType && scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.pc.some(p => p._characterKey === fromKey)) fromType = 'pc'
          if (!fromType && scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.npc.some(p => p._characterKey === fromKey)) fromType = 'npc'
          if (!fromType && scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.righthand.some(p => p._characterKey === fromKey)) fromType = 'right-hand'
          await chatListState.insertData({
            raw: cmd,
            diceRaw: getDiceRollResultText(bcdiceResult?.text),
            tag: [''],
            tab: '',
            type: 'chat',
            diceType: bcdiceResult ? diceResult ? 'dice-roll-scf' : 'dice-roll' : null,
            fromType: fromType || 'user',
            from: fromKey || '',
            diceRollResult: bcdiceResult ? diceResult || null : null,
            rands: bcdiceResult?.rands || null,
            secret: bcdiceResult?.secret ? 'secret' : 'none'
          })
        }
      }
    }

    const from = ref<string | null>(selfUserRef.value?.key || null)

    const chatHistoryList = ref<{
      key: string;
      owner: string;
      viewTextInfo: {
        type: 'chat' | 'system';
        fromType: 'user' | 'pc' | 'npc' | 'right-hand';
        text: string;
        from: string;
        diceText: string | null;
        diceRollResult: string | null;
        color: string;
        secret: 'none' | 'secret' | 'opened';
        standImage: string | null;
        isMe: boolean;
      };
      pips: [string, number][];
    }[]>([])

    const diceRollEnd = ref<(() => void) | null>(null)
    // const diceRollTimeoutId = ref<number | null>(null)
    const onEndDiceRoll = () => {
      if (diceRollEnd.value) {
        diceRollEnd.value()
      }
    }

    const getChatStyle = (chat: ChatStore | null, num: number): Record<string, string> => {
      if (!chat) return {}
      const result: Record<string, string> = {}
      if (num === 1) console.log(JSON.stringify(chat))
      const setPc = () => {
        if (!result['--color']) {
          const pc = scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.pc.find(d => d._characterKey === chat.from)
          result['--color'] = pc?.color || ''
        }
      }
      const setNpc = () => {
        if (!result['--color']) {
          const npc = scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.npc.find(d => d._characterKey === chat.from)
          result['--color'] = npc?.color || ''
        }
      }
      const setRightHand = () => {
        if (!result['--color']) {
          const rightHand = scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.righthand.find(d => d._characterKey === chat.from)
          result['--color'] = rightHand?.color || ''
        }
      }
      if (chat.fromType === 'pc') {
        setPc()
        setNpc()
        setRightHand()
        if (!result['--color']) result['--color'] = '#000'
      } else if (chat.fromType === 'npc') {
        setNpc()
        setPc()
        setRightHand()
        if (!result['--color']) result['--color'] = '#000'
      } else if (chat.fromType === 'right-hand') {
        setRightHand()
        setPc()
        setNpc()
        if (!result['--color']) result['--color'] = '#000'
      } else {
        const userSetting = userSettingState.userSettingList.find(us => us.data?.userKey === chat.from)
        result['--color'] = userSetting?.data?.fontColor || '#000'
      }
      return result
    }

    const getFromLabel = (chat: ChatStore | null): string => {
      if (!chat) return ''
      let fromLabel: string | null = null
      const setPc = () => {
        if (fromLabel === null) {
          const pc = scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.pc.find(d => d._characterKey === chat.from)
          if (pc) {
            const character = characterState.characterList.find(c => c.key === chat.from)
            fromLabel = `PC ${pc.name} ${character?.data?.sheetInfo.characterName || ''}` || null
          }
        }
      }
      const setNpc = () => {
        if (fromLabel === null) {
          const npc = scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.npc.find(d => d._characterKey === chat.from)
          fromLabel = npc ? `NPC ${npc.name}` : null
        }
      }
      const setRightHand = () => {
        if (fromLabel === null) {
          const rightHand = scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.righthand.find(d => d._characterKey === chat.from)
          fromLabel = rightHand ? `腹心 ${rightHand.name}` : null
        }
      }
      if (chat.fromType === 'pc') {
        setPc()
        setNpc()
        setRightHand()
      } else if (chat.fromType === 'npc') {
        setNpc()
        setPc()
        setRightHand()
      } else if (chat.fromType === 'right-hand') {
        setRightHand()
        setPc()
        setNpc()
      } else {
        const u = userState.userList.find(u => u.key === chat.from)
        fromLabel = `${u?.name || '???'}(${u?.type.toUpperCase() || '??'})`
      }
      return `${fromLabel || '???'}${chat.type === 'system' ? '(System)' : ''}`
    }

    const randsToPips = (chat: ChatStore, key: string, owner: string): void => {
      const style = getChatStyle(chat, -1)
      const pc = scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.pc.find(d => d._characterKey === chat.from)
      const npc = scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.npc.find(d => d._characterKey === chat.from)
      const rightHand = scenarioState.list[scenarioState.currentIndex]?.data?.sheetInfo.righthand.find(d => d._characterKey === chat.from)
      const standImageList = pc?.standImageList || npc?.standImageList || rightHand?.standImageList
      const currentStandImage = (pc?.currentStandImage !== undefined && pc?.currentStandImage) ||
        (npc?.currentStandImage !== undefined && npc?.currentStandImage) ||
        (rightHand?.currentStandImage !== undefined && rightHand?.currentStandImage)
      const standImageKey = standImageList && standImageList.length > currentStandImage ? standImageList[currentStandImage || 0] : null
      const standImageUrl = mediaListState.list.find(n => n.key === standImageKey)?.data?.url || null

      let isMe = false
      if (pc?._userKey === selfUserRef.value?.key) isMe = true
      if ((npc || rightHand) && selfUserRef.value?.type === 'gm') isMe = true
      if (!pc && !npc && !rightHand && selfUserRef.value?.key === chat.from) isMe = true

      chatHistoryList.value
        .filter(ch => ch.viewTextInfo.secret === 'secret')
        .forEach(ch => {
          const chat = chatListState.list.find(c => c.key === ch.key)
          if (chat?.data?.secret !== 'secret') {
            ch.viewTextInfo.secret = chat?.data?.secret || 'secret'
          }
        })

      if (key !== chatHistoryList.value[0]?.key) {
        chatHistoryList.value.unshift({
          key,
          owner,
          viewTextInfo: {
            type: chat.type,
            fromType: chat.fromType,
            from: chat.from,
            text: chat.raw,
            diceText: chat.diceRaw,
            diceRollResult: chat.diceRollResult,
            color: style['--color'] || '#000',
            secret: chat.secret,
            standImage: standImageUrl ? `url('${standImageUrl}')` : null,
            isMe
          },
          pips: chat.rands
            ?.map((r): [string, number] | null => {
              const type = 'black-6'
              if (r.sides !== 6) return null
              return [type, r.value]
            })
            .filter((r): r is [string, number] => r !== null) || []
        })
      }
      diceRollEnd.value = () => {
        diceRollEnd.value = null
        chatHistoryList.value = []
      }
    }

    const onChangeMode = (m: 'normal' | 'SG' | 'D6' | 'D6>=?') => {
      specialInputState.from = {
        type: from.value === selfUserRef.value?.key ? 'user' : 'character',
        key: from.value
      }
      specialInputState.setCmdType(m)
    }

    const openSecretDiceRoll = (chatKey: string) => {
      const chat = chatListState.list.find(c => c.key === chatKey)
      if (chat && chat.data) {
        chat.data.secret = 'opened'
      }
    }

    const onDiceCommand = async () => {
      const command = specialInputState.command
      specialInputState.setCmdType('normal')
      if (specialInputState.from.key) {
        const { insertChat } = await diceRollAndChat(command, specialInputState.from.key)
        await insertChat()
      }
    }

    const chatList = computed(() => chatListState.list)
    watch(() => [...chatList.value], newList => {
      setTimeout(() => {
        chatBottomElm.value?.scrollIntoView(false)
      })
      const chat = newList[newList.length - 1]
      if (chat && chat.data) {
        randsToPips(chat.data, chat.key, chat.owner || '')
      }
    }, { deep: true })

    const battleField = computed(() => roomSettingState.roomSetting?.battleField)
    const isMobile = computed(() => Boolean(navigator.userAgent.match(/Mobile/)))

    const enterPressing = ref(false)
    const sendMessage = async (event: KeyboardEvent, flg?: boolean): Promise<void> => {
      if (flg === undefined) {
        enterPressing.value = false
      } else {
        if (isMobile.value) {
          if (flg) chatInput.value += '\n'
          enterPressing.value = false
          return
        }
        if (enterPressing.value === flg) return
        enterPressing.value = flg
        if (!flg) return
      }

      if (event && event.shiftKey) {
        const textArea: HTMLTextAreaElement = event.target as HTMLTextAreaElement
        const sentence = textArea.value
        const pos = textArea.selectionStart

        const before = sentence.substr(0, pos)
        const after = sentence.substr(pos, sentence.length)
        chatInput.value = `${before}\n${after}`
        setTimeout(() => {
          textArea.selectionStart = pos + 1
          textArea.selectionEnd = pos + 1
        })
        return
      }
      if (chatInput.value === '') return

      if (from.value) {
        const { insertChat } = await diceRollAndChat(chatInput.value, from.value)
        chatInput.value = ''
        await insertChat()
      }
    }

    const getTimeFormat = (dateTime: number | null): string => {
      if (dateTime === null) return 'pattern-2'
      const today = new Date()
      const someDate = new Date(dateTime)
      const isToday = someDate.getDate() === today.getDate() &&
        someDate.getMonth() === today.getMonth() &&
        someDate.getFullYear() === today.getFullYear()
      return isToday ? 'pattern-2' : 'pattern-1'
    }

    return {
      isGm,
      pcList,
      npcList,
      rightHandList,
      enigmaList,
      bottomHeight,
      chatHistoryList,
      onEndDiceRoll,
      from,
      targetCharacterList,
      selfUserRef,
      chatBottomElm,
      onChangeMode,
      onDiceCommand,
      chatInput,
      globalStyle,
      characterList,
      layoutData: reactiveLayout,
      getChitStatus: (type: 'pc' | 'npc' | 'right-hand' | 'enigma', target: string) => scenarioState.getChitStatus(type, target, userState.selfUser?.key || ''),
      chatList,
      getFromLabel,
      getChatStyle,
      battleField,
      sendMessage,
      getTimeFormat,
      isMobile,
      openSecretDiceRoll
    }
  },
  name: 'the-play'
})
</script>

<style scoped lang="scss">
@use "../common";
@use "../animations";
@use "sass:math";

#the-play {
  position: absolute;
  right: 0;
  top: 0;
  height: calc(var(--vh, 1vh) * 100);
  width: 100vw;
  box-sizing: border-box;

  &:not(.battle-field-1) {
    .bubbles {
      display: none;
    }
  }
  &.battle-field-1 {
    @include common.deep("#section-core") {
      .effect-container:before {
        backdrop-filter: blur(1px) brightness(0.9);
        background-color: rgba(0, 0, 255, 0.05);
      }
    }
  }
  &.battle-field-2 {
    @include common.deep("#section-core") {
      background-size: 120%;

      .effect-container:before {
        backdrop-filter: saturate(3) brightness(1.2) sepia(0.8);
        background:
          repeating-conic-gradient(transparent,transparent 12deg, rgb(201, 201, 157) 12deg 15deg),
          repeating-conic-gradient(transparent,transparent 19deg, rgb(201, 201, 157) 19deg 22deg),
          repeating-conic-gradient(transparent,transparent 6deg, rgb(201, 201, 157) 6deg 8deg);
        mask: radial-gradient(circle at 50% 50%, transparent, rgba(255, 255, 255, 0.3) 100%);
        animation: beat 6s linear infinite;
      }

      @keyframes beat {
        40% {
          opacity: 0;
        }
        89.99% {
          opacity: 0;
        }
        90% {
          opacity: 1;
        }
      }
    }
  }

  &:not(.battle-field-3) {
    .rain {
      display: none;
    }
  }
  &.battle-field-3 {
    @include common.deep("#section-core") {
      .effect-container:before {
        backdrop-filter: brightness(0.8);
        background-color: rgba(0, 0, 0, 0.1);
      }

      .effects {
        transform: rotate(10deg);
      }
    }
  }

  &:not(.battle-field-4) {
    .circles {
      display: none;
    }
  }
  &.battle-field-4 {
    @include common.deep("#section-core") {
      .effect-container:before {
        background-color: rgba(100, 201, 100, 0.1);
      }
    }
  }

  &:not(.battle-field-5) {
    .flames {
      display: none;
    }
  }
  &.battle-field-5 {
    @include common.deep("#section-core") {
      .effect-container:before {
        background-color: rgba(255, 0, 0, 0.1);
      }
    }
  }
}

.history-block {
  position: absolute;
  left: 10vw;
  right: 10vw;
  pointer-events: none;
  top: common.$header-height;
  bottom: var(--bottom);
  overflow: visible;
  box-sizing: border-box;
  display: grid;
  grid-template-rows: 1fr auto;
  z-index: 40000;

  &.image-left {
    grid-template-columns: 40vmin 1fr 0;

    .img {
      grid-column: 1 / 2;
    }
  }

  &.image-right {
    grid-template-columns: 0 1fr 40vmin;

    .img {
      grid-column: 3 / 4;
    }
  }

  &.image-none {
    grid-template-columns: 20vmin 1fr 20vmin;
  }

  .history {
    @include common.flex-box(column-reverse, stretch, flex-start);
    grid-row: 1 / 2;
    grid-column: 2 / 3;
  }

  .view-text {
    pointer-events: all;
    padding: 0.3rem;
    text-align: left;
    font-size: 90%;
    font-weight: bold;
    white-space: pre-wrap;
    color: var(--color);
    background-color: rgba(255, 255, 255, 0.95);
    border-width: 1px;
    border-color: black;
    border-style: solid;
    @include common.inline-flex-box(column, flex-start, flex-start);
    transition: all ease 0.5s;
    cursor: pointer;
    padding-left: 0.5rem;

    .from-label {
      white-space: nowrap;
      font-size: 0.7em;
      margin-left: -0.5rem;
    }

    .chat-text {
      flex: 1;
    }

    &.first {
      grid-row: 2 / 3;
      grid-column: 1 / 4;
    }

    .dice-result {
      @include common.inline-flex-box(row, flex-start, center);
    }

    &.old {
      left: calc(10vw + 40vmin);
      font-size: 70%;
      z-index: calc(50 - var(--offset))
    }
  }

  .img {
    position: relative;
    grid-row: 1 / 2;
    background-image: var(--image);
    background-position: center bottom;
    background-repeat: no-repeat;
    background-size: contain;
    pointer-events: all;
    cursor: pointer;

    &.non-image {
      pointer-events: none;
    }
  }
}

.dice-wrap {
  pointer-events: all;
  cursor: pointer;
  position: absolute;
  right: 0;
  bottom: 0;
  width: common.$dice-size;
  height: common.$dice-size;
  overflow: visible;
  z-index: 40000;
  background-color: rgba(255, 255, 255, 0.5);
  transform: translateX(calc((var(--dice-count) - var(--offset) - 1) * -#{common.$dice-size} - var(--offset) * 0.7px));

  @mixin dice-image($type, $pips) {
    &.#{$type}-#{$pips} .dice {
      background-image: url("/static/img/dice/#{$type}/dice-#{$type}-#{$pips}.png");
    }
  }

  $dice-animation-duration: 0.8s;
  $dice-animation-count: 2;
  @mixin dice-animation($type) {
    &[class*="#{$type}"] .dice {
      animation:
        random-dice-#{$type} $dice-animation-duration linear 0s $dice-animation-count none,
        bounce ($dice-animation-duration * $dice-animation-count) linear 0s 1 none
      ;
    }
  }

  @for $i from 1 through 6 {
    @include dice-image("black-6", $i);
    @include dice-image("white-6", $i);
  }

  .dice {
    background-size: contain;
    background-position: center center;
    background-repeat: no-repeat;
    filter: drop-shadow(2px 8px 5px var(--color));
    @include common.position-full-size();
  }

  &.roll {
    animation: dice-roll-in ($dice-animation-duration * $dice-animation-count) linear 0s 1 none;

    @include dice-animation("black-6");
    @include dice-animation("white-6");
  }
}

.chat {
  @include common.inline-flex-box(column, stretch, center);
  color: var(--color);
  text-align: left;
  word-wrap: break-word;
  overflow-wrap: anywhere;
  word-break: break-all;
  padding-left: 0.5rem;
  min-width: 10em;

  &.dice-result {
    @include common.inline-flex-box(row, flex-start, center);
    margin-top: -1rem;
  }

  .from-label {
    @include common.inline-flex-box(row, space-between, center);
    white-space: nowrap;
    font-size: 0.7em;
    margin-left: -0.5rem;
  }

  .chat-text {
    white-space: pre-wrap;
  }
}

.dice-roll-result {
  border: 1px solid gray;
  border-radius: 3px;
  padding: 0 0.2rem;
  white-space: nowrap;
  margin-right: 0.3rem;
}

textarea {
  resize: horizontal;
}

@include common.deep(".top-box") {
  background-color: common.$menu-back-color;
  border-bottom: 1px solid #495478;
  padding-left: calc(#{common.$header-height} + 0.5rem);
  box-sizing: border-box;
  align-items: center;
  z-index: 30001;
  gap: 0.5rem;
  overflow: hidden !important;
}

@include common.deep(".right-box") {
  position: relative;
  scroll-behavior: smooth;
  white-space: pre-wrap;
  text-align: left;
}

@include common.deep(".bottom-box") {
  .bottom-box-left {
    @include common.flex-box(column, stretch, flex-start);

    > * {
      flex: 1;
    }
  }

  #chat-input {
    flex: 1;
    resize: none;
  }
}

@include common.deep(".simple-center") {
  gap: 0.5rem;
}

@include common.deep(".left-box") {
  gap: 1rem;
  overscroll-behavior: none;
}

@include common.deep("#section-root") {
  position: relative;
  z-index: 1;
}

@include common.deep(".dramatic-scene") {
  border: 1px solid black;
  padding: 0.3rem;
  gap: 0.3rem;
}

@include common.deep("#section-core-contents") {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  gap: 0.5rem;
}
@include common.deep("#section-core") {
  gap: 0.5rem 0.5rem;
  background-image: var(--background-image);
  background-position: center;
  background-size: cover;
  background-origin: content-box;
  background-repeat: no-repeat;
  position: relative;
  overflow-x: hidden;
  overflow-y: auto;

  .effect-container {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;

    /* 戦場によるフィルターをかける場所 */
    &:before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 0;
    }

    .effects {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
    }
  }

  select {
    background-color: rgba(255, 255, 255, 0.5);
  }

  .rain {
    position: relative;
    margin-right: -0.5rem;
    pointer-events: none;
    animation: fall 0.8s linear infinite;
    z-index: 1;

    i {
      position: absolute;
      bottom: 200px;
      width: 1px;
      height: 30px;
      background: linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,.6) 100%);
      border-radius: 50%;
    }

    @keyframes fall{
      to {
        margin-top: calc(var(--vh) * 100);
      }
    }
  }

  .bubbles {
    position: absolute;
    bottom: 0;
    display: inline-block;
    z-index: 1;

    &.sec1 {
      left: 20%;
      transform: scale(1.3);
    }

    &.sec2 {
      left: 60%;
      transform: scale(2.1);
    }

    &.sec3 {
      left: 80%;
    }
  }

  .bubble {
    position: relative;
    animation: short-bubble 1500ms linear infinite;
    animation-fill-mode: forwards;
    height: 10px;
    width: 9px;
    border: 1px solid rgba(240, 240, 240, 0.5);
    border-radius: 50%;
    background-color: transparent;
    box-shadow: inset 0 0 10px rgba(255, 255, 255, 0.2);
    pointer-events: none;

    &:before {
      content: "";
      position: absolute;
      width: 100%;
      height: 100%;
      transform: scale(0.25) translate(-70%, -70%);
      background: radial-gradient(rgba(255,255,255, 0.5), transparent);
      border-radius: 50%;
    }
  }

  .b2 {
    animation: medium-bubble 5000ms linear infinite;
    animation-fill-mode: forwards;
    margin-left: -7px;
    margin-top: 25px;
    height: 13px;
    width: 12px;
  }

  .b3 {
    animation-duration: 3500ms;
    margin-left: -5px;
    margin-bottom: 10px;
  }

  .b4 {
    animation-duration: 2000ms;
    animation-fill-mode: forwards;
    margin: 0 0 40px -9px;
    height: 7px;
    width: 6px;
  }

  .b5 {
    animation: medium-bubble 3000ms linear infinite;
    animation-fill-mode: forwards;
    margin-left: -1px;
    margin-top: 100px;
    height: 5px;
    width: 4px;
  }

  .b6 {
    animation-duration: 3000ms;
    margin-left: -8px;
    margin-bottom: 50px;
  }

  .b7 {
    animation-duration: 6000ms;
    margin-left: -3px;
    margin-bottom: 50px;
    height: 7px;
    width: 6px;
  }

  .b8 {
    animation: medium-bubble 2000ms linear infinite;
    animation-fill-mode: forwards;
    margin-left: -13px;
    margin-bottom: 30px;
  }

  @keyframes short-bubble{
    0%{ transform:translate3d(5px, 0, 0);opacity:0; }
    13%{ transform:translate3d(2px, -20px, 0); opacity:1; }
    20%{ transform:translate3d(5px, -40px, 0) scale(1.2); }
    30%{ transform:translate3d(0px, -60px, 0); }
    40%{ transform:translate3d(8px, -80px, 0); }
    50%{ transform:translate3d(3px, -100px, 0); }
    60%{ transform:translate3d(8px, -120px, 0); }
    70%{ opacity:0.4; }
    80%, 100%{ transform:translate3d(0,-200px, 0); opacity:0; }
  }

  @keyframes medium-bubble{
    0%{ transform:translate3d(0, 0, 0); opacity:0;}
    5%{ transform:translate3d(4px, -20px, 0); opacity:1;}
    10%{ transform:translate3d(2px, -40px, 0) rotate(10deg); }
    20%{ transform:translate3d(7px, -80px, 0) rotate(14deg) scale(0.7); }
    30%{ transform:translate3d(5px, -120px, 0) rotate(15deg); }
    40%{ transform:translate3d(1px, -160px, 0) rotate(20deg); }
    50%{ transform:translate3d(2px, -200px, 0) rotate(18deg) scale(1.1); }
    60%{ transform:translate3d(-3px, -240px, 0) rotate(22deg); opacity:0.4; }
    100%{ transform:translate3d(0, -400px, 0); opacity:0; }
  }

  .circles {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;

    li {
      position: absolute;
      display: block;
      list-style: none;
      width: 20px;
      height: 20px;
      background: rgba(255, 255, 255, 0.3);
      animation: circle-anime 15s linear infinite;
      right: -150px;
      border: 1px solid rgba(0, 0, 0, 0.1);

      @keyframes circle-anime {
        0%{
          transform: translateX(0) rotate(0deg);
          opacity: 1;
          border-radius: 0;
        }

        100%{
          transform: translateX(-100vw) rotate(720deg);
          opacity: 0;
          border-radius: 80%;
        }
      }

      &:nth-child(1) {
        top: 25%;
        width: 80px;
        height: 80px;
        animation-delay: 0s;
      }

      &:nth-child(2) {
        top: 10%;
        width: 20px;
        height: 20px;
        animation-delay: 2s;
        animation-duration: 12s;
      }

      &:nth-child(3) {
        top: 70%;
        width: 20px;
        height: 20px;
        animation-delay: 4s;
      }

      &:nth-child(4) {
        top: 40%;
        width: 60px;
        height: 60px;
        animation-delay: 0s;
        animation-duration: 18s;
      }

      &:nth-child(5) {
        top: 65%;
        width: 20px;
        height: 20px;
        animation-delay: 0s;
      }

      &:nth-child(6) {
        top: 75%;
        width: 110px;
        height: 110px;
        animation-delay: 3s;
      }

      &:nth-child(7) {
        top: 35%;
        width: 150px;
        height: 150px;
        animation-delay: 7s;
      }

      &:nth-child(8) {
        top: 50%;
        width: 25px;
        height: 25px;
        animation-delay: 15s;
        animation-duration: 45s;
      }

      &:nth-child(9) {
        top: 20%;
        width: 15px;
        height: 15px;
        animation-delay: 2s;
        animation-duration: 35s;
      }

      &:nth-child(10) {
        top: 85%;
        width: 150px;
        height: 150px;
        animation-delay: 0s;
        animation-duration: 11s;
      }
    }
  }

  $particleSize: 20vmin;
  $animationDuration: 6s;
  $flame-num: 20;
  .flames {
    width: 100vw;
    height: calc(var(--vh, 1vh) * 100);
    //background: #3E1E68;

    span {
      width: $particleSize;
      height: $particleSize;
      border-radius: $particleSize;
      backface-visibility: hidden;
      position: absolute;
      animation-name: move;
      animation-duration: $animationDuration;
      animation-timing-function: linear;
      animation-iteration-count: infinite;
      $colors: (
        #583C87,
        #E45A84,
        #FFACAC
      );
      @for $i from 1 through $flame-num {
        &:nth-child(#{$i}) {
          color: nth($colors, random(length($colors)));
          top: random(100) * 1%;
          left: random(100) * 1%;
          animation-duration: (math.div(random($animationDuration * 10), 10)) * 1s + 10s;
          animation-delay: math.div(random(($animationDuration + 10s) * 10), 10) * -1s;
          transform-origin: (random(50) - 25) * 1vw (random(50) - 25) * 1vh;
          $blurRadius: (random() + 0.5) * $particleSize * 0.5;
          $x: if(random() > 0.5, -1, 1);
          box-shadow: ($particleSize * 2 * $x) 0 $blurRadius currentColor;
          opacity: 0.3;
        }
      }
    }
   }

  @keyframes move {
    100% {
      transform: translate3d(0, 0, 1px) rotate(360deg);
    }
  }

  > * {
    z-index: 1;
  }
}

@include common.deep("#section-scene") {
  min-width: unquote(min(calc(24em + 47px), 100%));
  max-width: unquote(min(40em, 100%));
}

@include common.deep(".velocity-system") {
  justify-self: flex-end;
  min-width: unquote(min(calc(24em + 47px), 100%));
  max-width: unquote(min(40em, 100%));
  box-sizing: border-box;
  border: 1px solid black;
  padding: 5px;
  overflow-x: auto;
  gap: 5px;
}

.cut-in-container {
  @include common.flex-box(row, flex-end, flex-start);
  gap: 0.5rem;
  z-index: 70000;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

</style>
