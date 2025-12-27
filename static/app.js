
const tab = {
  data() {
    return {
      stocks: [],
      search: "",
      sortKey: "name",
      sortOrder: "asc",
      tagFilter: "all",
      boughtMap: {}, // track bought state per stock
      loading: true,
      error: null
    };
  },

  computed: {
    processedStocks() {
      let list = [...this.stocks];

      // Search
      const q = this.search.toLowerCase();
      if (q) list = list.filter(s => s.name.toLowerCase().includes(q));

      // Tag filter
      if (this.tagFilter !== "all") {
        list = list.filter(s => s.tag === Number(this.tagFilter));
      }

      // Sort
      list.sort((a, b) => {
        const x = a[this.sortKey];
        const y = b[this.sortKey];

        if (typeof x === "string") {
          return this.sortOrder === "asc"
            ? x.localeCompare(y)
            : y.localeCompare(x);
        }
        return this.sortOrder === "asc" ? x - y : y - x;
      });

      return list;
    }
  },

  methods: {
    buyStock(stock) {
      if (this.boughtMap[stock.name]) return;

      fetch(`/buy?q=${encodeURIComponent(stock.name)}`);

      this.$set
        ? this.$set(this.boughtMap, stock.name, true)
        : (this.boughtMap[stock.name] = true);

      setTimeout(() => {
        this.boughtMap[stock.name] = false;
      }, 1000);
    },

    removeStock(stock) {
        const ok = confirm(`Remove ${stock.name}?`);
        if (!ok) return;

        fetch(`/rm?q=${encodeURIComponent(stock.name)}`);
    }
  },

  mounted() {
    fetch("/data")
      .then(res => res.json())
      .then(data => {
        this.stocks = data;
        this.loading = false;
      })
      .catch(err => {
        this.error = err.message;
        this.loading = false;
      });
  },

  template: `
    <div class="w-full">

      <!-- Controls -->
      <div class="flex flex-wrap items-center gap-3 px-4 py-3 bg-white sticky top-0 z-10 border-b">

        <!-- Sort -->
        <div class="flex items-center gap-2">
          <select v-model="sortKey" class="text-sm border rounded px-2 py-1">
            <option value="name">Name</option>
            <option value="price">Price</option>
            <option value="market_cap">Market Cap</option>
            <option value="pe">PE</option>
            <option value="roe">ROE</option>
            <option value="roce">ROCE</option>
            <option value="qtr_profit_var">QoQ Profit</option>
            <option value="qtr_sales_var">QoQ Sales</option>
          </select>

          <button
            @click="sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'"
            class="px-2 py-1 text-sm border rounded hover:bg-gray-100"
          >
            {{ sortOrder === "asc" ? "↑" : "↓" }}
          </button>
        </div>

        <!-- Search -->
        <input
          v-model="search"
          placeholder="Search stock..."
          class="flex-1 min-w-[180px] px-3 py-1.5 text-sm border rounded
                 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <!-- Tag filter -->
        <select v-model="tagFilter" class="text-sm border rounded px-2 py-1">
          <option value="all">All</option>
          <option value="1">Positive</option>
          <option value="0">Neutral</option>
          <option value="-1">Negative</option>
        </select>
      </div>

      <!-- List -->
      <div class="p-2">
        <div
          v-for="stock in processedStocks"
          :key="stock.name"
          class="mb-2 px-4 py-3 rounded border text-xs transition"
          :class="{
            'bg-green-50 hover:bg-green-100': stock.tag === 1,
            'bg-red-50 hover:bg-red-100': stock.tag === -1,
            'bg-white hover:bg-gray-50': stock.tag === 0
          }"
        >

          <!-- Header -->
          <div class="flex justify-between items-center">
            <div>
                <div class="text-sm font-semibold">{{ stock.name }}</div>
                <div class="text-sm font-semibold">₹{{ stock.price }}</div>
            </div>

            <div class="flex gap-2">
                <!-- Buy button -->
                <button
                @click="buyStock(stock)"
                :disabled="boughtMap[stock.name]"
                class="px-3 py-1.5 text-xs font-semibold rounded transition"
                :class="boughtMap[stock.name]
                    ? 'bg-gray-300 text-gray-700 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'"
                >
                {{ boughtMap[stock.name] ? 'Bought' : 'Buy' }}
                </button>

                <!-- Remove button -->
                <button
                @click="removeStock(stock)"
                class="px-3 py-1.5 text-xs font-semibold rounded
                        bg-red-600 text-white hover:bg-red-700 transition"
                >
                Remove
                </button>
            </div>
            </div>


          <!-- Ratios -->
          <div class="grid grid-cols-4 gap-4 mt-2">
            <span>PE <b>{{ stock.pe }}</b></span>
            <span>Book <b>₹{{ stock.book }}</b></span>
            <span>ROE <b>{{ stock.roe }}%</b></span>
            <span>ROCE <b>{{ stock.roce }}%</b></span>
          </div>

          <!-- High / Low -->
          <div class="grid grid-cols-4 gap-4 mt-1">
            <span>High <b>₹{{ stock.high }}</b></span>
            <span>Low <b>₹{{ stock.low }}</b></span>
            <span>Dev <b>{{ stock.deviation }}</b></span>
          </div>

          <!-- Quarterly -->
          <div class="grid grid-cols-4 gap-4 mt-1">
            <span>Sales Q <b>₹{{ stock.sales_qtr.toLocaleString() }}</b></span>
            <span>Profit Q <b>₹{{ stock.np_qtr.toLocaleString() }}</b></span>
            <span>Sales QoQ <b>{{ stock.qtr_sales_var }}%</b></span>
            <span>Profit QoQ <b>{{ stock.qtr_profit_var }}%</b></span>
          </div>

          <div class="mt-1 text-gray-500">
            Market Cap ₹{{ stock.market_cap.toLocaleString() }}
          </div>
        </div>
      </div>

    </div>
  `
};



const tab2 = {
  data() {
    return {
      stocks: [],
      loading: true,
      error: null
    };
  },

  mounted() {
    fetch("/holdings")
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch data");
        return res.json();
      })
      .then(json => {
        this.stocks = json;
        this.loading = false;
      })
      .catch(err => {
        this.error = err.message;
        this.loading = false;
      });
  },

  template: `
    <div class="w-full">

      <!-- Loading -->
      <div v-if="loading" class="p-4 text-sm text-gray-500">
        Loading stocks...
      </div>

      <!-- Error -->
      <div v-else-if="error" class="p-4 text-sm text-red-600">
        {{ error }}
      </div>

      <!-- Stock list -->
      <div v-else>
        <div
          v-for="stock in stocks"
          :key="stock.name"
          class="w-full px-4 py-3 border-b border-gray-200 hover:bg-gray-50 transition text-xs text-gray-700"
        >

          <!-- Header -->
          <div class="flex justify-between items-center">
            <span class="text-sm font-semibold text-gray-900">
              {{ stock.name }}
            </span>
            <span class="text-sm font-semibold text-gray-900">
              ₹{{ stock.price }}
            </span>
          </div>

          <!-- Core ratios -->
          <div class="grid grid-cols-4 gap-x-4 mt-1">
            <span>PE <b class="text-gray-900">{{ stock.pe }}</b></span>
            <span>Book <b class="text-gray-900">₹{{ stock.book }}</b></span>
            <span>ROE <b class="text-gray-900">{{ stock.roe }}%</b></span>
            <span>ROCE <b class="text-gray-900">{{ stock.roce }}%</b></span>
          </div>

          <!-- High / Low / Deviation -->
          <div class="grid grid-cols-4 gap-x-4 mt-1">
            <span>High <b class="text-gray-900">₹{{ stock.high }}</b></span>
            <span>Low <b class="text-gray-900">₹{{ stock.low }}</b></span>
            <span>Dev <b class="text-gray-900">{{ stock.deviation }}</b></span>
            <span>
              Tag
              <b :class="stock.tag < 0 ? 'text-red-600' : 'text-green-600'">
                {{ stock.tag }}
              </b>
            </span>
          </div>

          <!-- Quarterly -->
          <div class="grid grid-cols-4 gap-x-4 mt-1">
            <span>
              Sales Q
              <b class="text-gray-900">₹{{ stock.sales_qtr.toLocaleString() }}</b>
            </span>
            <span>
              Profit Q
              <b class="text-gray-900">₹{{ stock.np_qtr.toLocaleString() }}</b>
            </span>
            <span>
              Sales QoQ
              <b class="text-gray-900">{{ stock.qtr_sales_var }}%</b>
            </span>
            <span>
              Profit QoQ
              <b class="text-gray-900">{{ stock.qtr_profit_var }}%</b>
            </span>
          </div>

          <!-- Market cap -->
          <div class="mt-1 text-gray-500">
            Market Cap ₹{{ stock.market_cap.toLocaleString() }}
          </div>

        </div>
      </div>

    </div>
  `
};

const app = Vue.createApp({});
app.component("tab", tab);
app.component("tab2", tab2);
app.mount("#app");
